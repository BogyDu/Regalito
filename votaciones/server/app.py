from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db/database.db'
db = SQLAlchemy(app)

class Availability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    dates = db.Column(db.String(500), nullable=False)

@app.route('/submit', methods=['POST'])
def submit_availability():
    data = request.get_json()
    name = data['name']
    dates = data['dates']
    
    new_availability = Availability(name=name, dates=dates)
    db.session.add(new_availability)
    db.session.commit()

    return jsonify({"message": "Data submitted successfully!"})

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)