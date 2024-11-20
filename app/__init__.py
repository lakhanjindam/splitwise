from flask import Flask, jsonify
from config import Config
from .extensions import db, migrate, login_manager
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_cors import CORS

csrf = CSRFProtect()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "X-CSRF-Token"],
            "supports_credentials": True
        }
    })

    # Initialize Flask extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)

    # CSRF token endpoint
    @app.route('/api/csrf-token', methods=['GET'])
    def get_csrf_token():
        token = generate_csrf()
        return jsonify({'csrf_token': token})

    # Register blueprints
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .groups import groups as groups_blueprint
    app.register_blueprint(groups_blueprint)

    from .expenses import expenses as expenses_blueprint
    app.register_blueprint(expenses_blueprint)

    from .routes import routes as routes_blueprint
    app.register_blueprint(routes_blueprint)

    @login_manager.user_loader
    def load_user(user_id):
        from .models import User
        return User.query.get(int(user_id))

    return app
