from flask import Flask, request, jsonify
import shodan
import os

app = Flask(__name__)
SHODAN_API_KEY = os.getenv("00SNyYaiGViWtWtXbe3enawmqLrSdMMN")
api = shodan.Shodan(SHODAN_API_KEY)

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '')
    try:
        results = api.search(query)
        return jsonify(results['matches'])
    except shodan.APIError as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
