from flask import Flask, request, jsonify
import shodan

app = Flask(__name__)
SHODAN_API_KEY = 'TU_CLAVE_API_DE_SHODAN'

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
    app.run(debug=True)
