from flask import Flask
from config import Config
from .extensions import db, migrate, login_manager
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)

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
