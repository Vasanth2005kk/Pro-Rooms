from flask import Flask ,render_template


app = Flask(__name__)

@app.route("/")
@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')


@app.route("/user/<string:name>",methods=['GET','POST'])
def user_details(name):
    return f"{name} hii user !!!"



if __name__ == "__main__":
    app.run(port=4000,debug=True )