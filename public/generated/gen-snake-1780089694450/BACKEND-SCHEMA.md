generator client 
provider = "prisma-client-js"

model SnakeScore {
  id        String   @id @default(cuid())
  player    String
  score     Int
  createdAt DateTime @default(now())
}

model SnakeGame {
  id        String   @id @default(cuid())
  state     Json?
  createdAt DateTime @default(now())
}