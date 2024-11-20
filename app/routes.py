from flask import Blueprint
from .models import db, User, Group
from flask_login import login_required

routes = Blueprint('routes', __name__)

@routes.route('/setup')
def setup():
    # Create an admin user
    admin = User(username='admin', email='admin@example.com')
    admin.set_password('admin123')
    db.session.add(admin)
    
    # Update any existing groups to have the admin as creator
    groups = Group.query.all()
    for group in groups:
        group.created_by_id = admin.id
    
    db.session.commit()
    return 'Setup complete!'
