from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from .extensions import db, migrate, login_manager

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize CORS
    CORS(app, supports_credentials=True, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-CSRF-Token"],
            "expose_headers": ["Content-Type", "X-CSRF-Token"],
            "supports_credentials": True
        }
    })
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    
    # Import models to ensure they are registered with SQLAlchemy
    from . import models
    
    # Configure login manager
    @login_manager.user_loader
    def load_user(id):
        return models.User.query.get(int(id))
    
    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({
            'status': 'error',
            'message': 'Authentication required',
            'data': None
        }), 401
    
    # Register blueprints
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)
    
    from .groups import groups as groups_blueprint
    app.register_blueprint(groups_blueprint)
    
    from .expenses import expenses as expenses_blueprint
    app.register_blueprint(expenses_blueprint)
    
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    from .routes import routes as routes_blueprint
    app.register_blueprint(routes_blueprint)
    
    # CSRF token route
    @app.route('/api/csrf-token', methods=['GET'])
    def get_csrf_token():
        return jsonify({
            'status': 'success',
            'message': 'CSRF token retrieved',
            'data': {
                'csrf_token': 'dummy-token'  # Replace with actual CSRF token implementation
            }
        })
    
    return app
