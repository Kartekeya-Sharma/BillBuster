from flask import Blueprint, request, jsonify
from firebase_admin import firestore, messaging
import os

main = Blueprint('main', __name__)
db = firestore.client()

@main.route('/api/scan', methods=['POST'])
def scan_bill():
    # Mock response for now
    return jsonify({
        'success': True,
        'data': {
            'total': 100.00,
            'items': [
                {'name': 'Item 1', 'price': 50.00},
                {'name': 'Item 2', 'price': 50.00}
            ]
        }
    })

@main.route('/api/save-transaction', methods=['POST'])
def save_transaction():
    data = request.json
    group_id = data.get('groupId')
    bill_data = data.get('billData')
    
    if not group_id or not bill_data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Save to Firestore
        db.collection('groups').document(group_id).collection('transactions').add(bill_data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/balance/<groupId>', methods=['GET'])
def get_balance(group_id):
    try:
        # Get all transactions for the group
        transactions = db.collection('groups').document(group_id).collection('transactions').stream()
        
        # Calculate balances
        balances = {}
        for transaction in transactions:
            data = transaction.to_dict()
            payer = data.get('payer')
            amount = data.get('amount', 0)
            
            if payer not in balances:
                balances[payer] = 0
            balances[payer] += amount
            
            # Split amount among members
            split_amount = amount / len(data.get('members', []))
            for member in data.get('members', []):
                if member != payer:
                    if member not in balances:
                        balances[member] = 0
                    balances[member] -= split_amount
        
        return jsonify({'success': True, 'balances': balances})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/send-reminder', methods=['POST'])
def send_reminder():
    data = request.json
    recipient_id = data.get('recipientId')
    amount = data.get('amount')
    message = data.get('message')
    
    if not all([recipient_id, amount, message]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Save reminder to Firestore
        reminder_data = {
            'recipientId': recipient_id,
            'amount': amount,
            'message': message,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'status': 'pending'
        }
        
        db.collection('reminders').add(reminder_data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/groups', methods=['GET'])
def get_groups():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId parameter'}), 400
    
    try:
        # Get groups where user is a member
        groups = db.collection('groups').where('members', 'array_contains', user_id).stream()
        return jsonify({
            'success': True,
            'groups': [{'id': group.id, **group.to_dict()} for group in groups]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/groups', methods=['POST'])
def create_group():
    data = request.json
    name = data.get('name')
    members = data.get('members', [])
    
    if not name or not members:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Create new group
        group_data = {
            'name': name,
            'members': members,
            'createdAt': firestore.SERVER_TIMESTAMP
        }
        
        group_ref = db.collection('groups').add(group_data)
        return jsonify({
            'success': True,
            'groupId': group_ref[1].id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/send-notification', methods=['POST'])
def send_notification():
    data = request.json
    token = data.get('token')
    title = data.get('title')
    body = data.get('body')
    data_payload = data.get('data', {})

    if not all([token, title, body]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data_payload,
            token=token
        )
        
        response = messaging.send(message)
        return jsonify({
            'success': True,
            'messageId': response
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500 