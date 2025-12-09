"""
API для регистрации и авторизации пользователей Shtorm.
Обрабатывает регистрацию по номеру телефона и вход в систему.
"""

import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def get_db_connection():
    """Создает подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Обработчик регистрации и авторизации пользователей.
    POST /register - регистрация нового пользователя
    POST /login - вход существующего пользователя
    """
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    phone = body_data.get('phone', '').strip()
    
    if not phone:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Phone is required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if action == 'register':
            name = body_data.get('name', '').strip()
            avatar = body_data.get('avatar', '👤')
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Name is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "SELECT id FROM users WHERE phone = %s",
                (phone,)
            )
            existing = cursor.fetchone()
            
            if existing:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Phone already registered'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "INSERT INTO users (phone, name, avatar) VALUES (%s, %s, %s) RETURNING id, phone, name, avatar, status",
                (phone, name, avatar)
            )
            user = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'user': {
                        'id': user[0],
                        'phone': user[1],
                        'name': user[2],
                        'avatar': user[3],
                        'status': user[4]
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            cursor.execute(
                "UPDATE users SET last_seen = %s WHERE phone = %s RETURNING id, phone, name, avatar, status",
                (datetime.now(), phone)
            )
            user = cursor.fetchone()
            conn.commit()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'user': {
                        'id': user[0],
                        'phone': user[1],
                        'name': user[2],
                        'avatar': user[3],
                        'status': user[4]
                    }
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    finally:
        cursor.close()
        conn.close()
