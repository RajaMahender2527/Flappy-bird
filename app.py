import os
import logging
from flask import Flask, render_template, send_from_directory


logging.basicConfig(level=logging.DEBUG)


app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "flappy-bird-secret-key")

@app.route('/')
def index():
    """Serve the main game page"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)               