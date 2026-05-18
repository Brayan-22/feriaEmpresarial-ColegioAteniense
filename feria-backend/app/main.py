import uvicorn
from mangum import Mangum

from app.api import create_app

app = create_app()

handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
