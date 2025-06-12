from flask import Blueprint, request, jsonify, current_app
from firebase_admin import firestore
import json
import logging

main = Blueprint('main', __name__)

@main.route('/api/scan', methods=['POST'])
def scan_bill():
    current_app.logger.info('Received bill scan request')
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
    current_app.logger.info('Received save transaction request')
    data = request.json
    group_id = data.get('groupId')
    bill_data = data.get('billData')
    
    if not group_id or not bill_data:
        current_app.logger.error('Missing required fields in save transaction request')
        return jsonify({'error': 'Missing required fields'}), 400
    
    db = firestore.client()
    try:
        db.collection('transactions').add({
            'groupId': group_id,
            'billData': bill_data,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        current_app.logger.info(f'Successfully saved transaction for group {group_id}')
        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f'Error saving transaction: {str(e)}')
        return jsonify({'error': str(e)}), 500

@main.route('/api/balance/<groupId>', methods=['GET'])
def get_balance(groupId):
    current_app.logger.info(f'Received balance request for group {groupId}')
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
        
        current_app.logger.info(f'Successfully retrieved balances for group {groupId}')
        return jsonify({'success': True, 'balances': balances})
    except Exception as e:
        current_app.logger.error(f'Error getting balance: {str(e)}')
        return jsonify({'error': str(e)}), 500

@main.route('/api/groups', methods=['GET'])
def get_groups():
    user_id = request.args.get('userId')
    if not user_id:
        current_app.logger.error('Missing userId parameter in get groups request')
        return jsonify({'error': 'Missing userId parameter'}), 400
    
    current_app.logger.info(f'Received get groups request for user {user_id}')
    db = firestore.client()
    try:
        groups = db.collection('groups').where('members', 'array_contains', user_id).stream()
        groups_list = [{'id': group.id, **group.to_dict()} for group in groups]
        current_app.logger.info(f'Successfully retrieved {len(groups_list)} groups for user {user_id}')
        return jsonify({
            'success': True,
            'groups': groups_list
        })
    except Exception as e:
        current_app.logger.error(f'Error getting groups: {str(e)}')
        return jsonify({'error': str(e)}), 500

@main.route('/api/groups', methods=['POST'])
def create_group():
    current_app.logger.info('Received create group request')
    data = request.json
    name = data.get('name')
    members = data.get('members')
    
    if not name or not members:
        current_app.logger.error('Missing required fields in create group request')
        return jsonify({'error': 'Missing required fields'}), 400
    
    db = firestore.client()
    try:
        group_ref = db.collection('groups').add({
            'name': name,
            'members': members,
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        current_app.logger.info(f'Successfully created group {group_ref[1].id}')
        return jsonify({
            'success': True,
            'groupId': group_ref[1].id
        })
    except Exception as e:
        current_app.logger.error(f'Error creating group: {str(e)}')
        return jsonify({'error': str(e)}), 500 