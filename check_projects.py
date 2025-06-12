import asyncio
import sys
sys.path.append('/app')

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