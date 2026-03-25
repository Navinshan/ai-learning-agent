from flask import Flask, request, jsonify, send_from_directory
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/chat.html')
def serve_chat():
    return send_from_directory('.', 'chat.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    query = data.get('query', '')
    file_data = data.get('file', {})

    # Placeholder AI response - replace with actual AI integration
    response = f"You asked: {query}"
    if file_data:
        response += f"\n\nFile uploaded: {file_data.get('name', '')}"

    return jsonify({'response': response})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)