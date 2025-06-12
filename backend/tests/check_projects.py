import asyncio
import sys
import os

# Add the backend directory to the path (go up one level from tests/)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.supabase import DBConnection

async def get_projects():
    try:
        db = DBConnection()
        client = await db.client
        result = await client.table('projects').select('project_id, name').limit(5).execute()
        if result.data:
            print('Found projects:')
            for project in result.data:
                print(f"  - {project['project_id']} ({project.get('name', 'No name')})")
        else:
            print('No projects found')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(get_projects()) 