from fastapi import FastAPI

app = FastAPI()

@app.get("/") 
async def hola_mundo(): 
    return {"mensaje": "Hola mundo"}