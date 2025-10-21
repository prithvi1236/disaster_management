import sqlite3

conn = sqlite3.connect('disaster_management.db')
cursor = conn.cursor()
cursor.execute('UPDATE users SET is_approved = 1 WHERE role = "ADMIN"')
conn.commit()
conn.close()
print('✅ Approved admin users')