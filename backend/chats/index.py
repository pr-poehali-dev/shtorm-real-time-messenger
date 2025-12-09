"""
API для работы с чатами и сообщениями Shtorm.
Получение списка чатов, отправка и получение сообщений в реальном времени.
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
    Обработчик работы с чатами.
    GET /chats - получение списка чатов пользователя
    POST /chats - создание нового чата
    GET /messages - получение сообщений чата
    POST /messages - отправка сообщения
    """
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', 'chats')
            
            if action == 'chats':
                cursor.execute("""
                    SELECT DISTINCT c.id, c.name, c.is_group, c.created_at,
                           u.id as other_user_id, u.name as other_user_name, 
                           u.avatar as other_user_avatar, u.last_seen,
                           (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                           (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
                    FROM chats c
                    JOIN chat_members cm ON c.id = cm.chat_id
                    LEFT JOIN chat_members cm2 ON c.id = cm2.chat_id AND cm2.user_id != %s
                    LEFT JOIN users u ON cm2.user_id = u.id
                    WHERE cm.user_id = %s
                    ORDER BY last_message_time DESC NULLS LAST
                """, (user_id, user_id))
                
                chats_data = cursor.fetchall()
                chats = []
                
                for chat in chats_data:
                    is_online = False
                    if chat[7]:
                        time_diff = (datetime.now() - chat[7]).total_seconds()
                        is_online = time_diff < 300
                    
                    last_msg_time = ''
                    if chat[9]:
                        time_diff = (datetime.now() - chat[9]).total_seconds()
                        if time_diff < 3600:
                            last_msg_time = f"{int(time_diff / 60)} мин"
                        elif time_diff < 86400:
                            last_msg_time = chat[9].strftime('%H:%M')
                        else:
                            last_msg_time = chat[9].strftime('%d.%m.%y')
                    
                    chats.append({
                        'id': chat[0],
                        'name': chat[5] if chat[5] else chat[1],
                        'avatar': chat[6] if chat[6] else '👥',
                        'lastMessage': chat[8] or 'Нет сообщений',
                        'timestamp': last_msg_time,
                        'unread': 0,
                        'online': is_online
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'chats': chats}),
                    'isBase64Encoded': False
                }
            
            elif action == 'messages':
                chat_id = params.get('chat_id')
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'chat_id required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    SELECT m.id, m.text, m.sender_id, m.created_at, m.encrypted
                    FROM messages m
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (int(chat_id),))
                
                messages_data = cursor.fetchall()
                messages = []
                
                for msg in messages_data:
                    messages.append({
                        'id': str(msg[0]),
                        'text': msg[1],
                        'sender': 'user' if msg[2] == user_id else 'contact',
                        'timestamp': msg[3].isoformat(),
                        'encrypted': msg[4]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }
            
            elif action == 'contacts':
                cursor.execute("""
                    SELECT u.id, u.name, u.avatar, u.status, u.last_seen
                    FROM users u
                    WHERE u.id != %s
                    ORDER BY u.name ASC
                """, (user_id,))
                
                contacts_data = cursor.fetchall()
                contacts = []
                
                for contact in contacts_data:
                    is_online = False
                    status = contact[3]
                    if contact[4]:
                        time_diff = (datetime.now() - contact[4]).total_seconds()
                        is_online = time_diff < 300
                        if not is_online:
                            if time_diff < 3600:
                                status = f"Был(а) {int(time_diff / 60)} мин назад"
                            elif time_diff < 86400:
                                hours = int(time_diff / 3600)
                                status = f"Был(а) {hours} ч назад"
                            else:
                                status = "Был(а) давно"
                        else:
                            status = "В сети"
                    
                    contacts.append({
                        'id': contact[0],
                        'name': contact[1],
                        'avatar': contact[2],
                        'status': status,
                        'online': is_online
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'contacts': contacts}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'create_chat':
                other_user_id = body_data.get('user_id')
                
                if not other_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'user_id required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    SELECT c.id FROM chats c
                    JOIN chat_members cm1 ON c.id = cm1.chat_id AND cm1.user_id = %s
                    JOIN chat_members cm2 ON c.id = cm2.chat_id AND cm2.user_id = %s
                    WHERE c.is_group = false
                    LIMIT 1
                """, (user_id, other_user_id))
                
                existing = cursor.fetchone()
                
                if existing:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'chat_id': existing[0]}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "INSERT INTO chats (is_group) VALUES (false) RETURNING id"
                )
                chat_id = cursor.fetchone()[0]
                
                cursor.execute(
                    "INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)",
                    (chat_id, user_id, chat_id, other_user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'chat_id': chat_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'send_message':
                chat_id = body_data.get('chat_id')
                text = body_data.get('text', '').strip()
                
                if not chat_id or not text:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'chat_id and text required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "INSERT INTO messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                    (chat_id, user_id, text)
                )
                message = cursor.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'message': {
                            'id': str(message[0]),
                            'text': text,
                            'sender': 'user',
                            'timestamp': message[1].isoformat(),
                            'encrypted': True
                        }
                    }),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()
