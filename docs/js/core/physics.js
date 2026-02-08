export function applyGravity(entity, dt) {
  const gravity = 30;
  entity.velocity.y += gravity * dt;
  entity.position.y += entity.velocity.y;
}

export function checkGroundCollision(entity, groundLevel) {
  if (entity.position.y >= groundLevel) {
    entity.position.y = groundLevel;
    entity.velocity.y = 0;
    return true;
  }
  return false;
}

export function isColliding(entityA, entityB) {
  return !(
    entityA.position.x + entityA.width < entityB.position.x ||
    entityA.position.x > entityB.position.x + entityB.width ||
    entityA.position.y + entityA.height < entityB.position.y ||
    entityA.position.y > entityB.position.y + entityB.height
  );
}
