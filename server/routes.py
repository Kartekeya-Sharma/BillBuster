from flask import Blueprint, request, jsonify
from firebase_admin import firestore
import json

main = Blueprint('main', __name__)

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
    
    db = firestore.client()
    try:
        db.collection('transactions').add({
            'groupId': group_id,
            'billData': bill_data,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/balance/<groupId>', methods=['GET'])
def get_balance(groupId):
    db = firestore.client()
    try:
        transactions = db.collection('transactions').where('groupId', '==', groupId).stream()
        balances = {}
        
        for transaction in transactions:
            data = transaction.to_dict()
            for item in data['billData']['items']:
                if item['paidBy'] not in balances:
                    balances[item['paidBy']] = 0
                balances[item['paidBy']] += item['price']
        
        return jsonify({'success': True, 'balances': balances})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/groups', methods=['GET'])
def get_groups():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId parameter'}), 400
    
    db = firestore.client()
    try:
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
    members = data.get('members')
    
    if not name or not members:
        return jsonify({'error': 'Missing required fields'}), 400
    
    db = firestore.client()
    try:
        group_ref = db.collection('groups').add({
            'name': name,
            'members': members,
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        return jsonify({
            'success': True,
            'groupId': group_ref[1].id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500 