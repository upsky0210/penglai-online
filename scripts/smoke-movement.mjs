function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Move a smoke client through the same rate-limited player:update path as the
 * browser client. The caller owns state.mapId/x/y and updates it from server
 * snapshots or map:change messages.
 */
export async function moveSmokePlayer(
  ws,
  state,
  { mapId, x: targetX, y: targetY, name, className, facing = "right" }
) {
  if (state.mapId !== mapId || !Number.isFinite(state.x) || !Number.isFinite(state.y)) {
    throw new Error(
      `cannot move smoke player from ${state.mapId}@(${state.x},${state.y}) to ${mapId}@(${targetX},${targetY})`
    );
  }

  async function moveStepwise(nextX, nextY) {
    const deadline = Date.now() + 60_000;
    while (Math.abs(nextX - state.x) > 1 || Math.abs(nextY - state.y) > 1) {
      if (Date.now() > deadline) {
        throw new Error(`timed out moving smoke player to ${mapId}@(${nextX},${nextY})`);
      }
      state.x += Math.sign(nextX - state.x) * Math.min(20, Math.abs(nextX - state.x));
      state.y += Math.sign(nextY - state.y) * Math.min(45, Math.abs(nextY - state.y));
      ws.send(
        JSON.stringify({
          type: "player:update",
          player: {
            id: state.playerId,
            name,
            className,
            mapId,
            x: state.x,
            y: state.y,
            facing,
            animation: "idle"
          }
        })
      );
      await wait(100);
    }
  }

  // Long chapter probes should not die to unrelated ground monsters while
  // walking to the actual portal/NPC assertion. Ascend at the current x, cross
  // at a bounded rate, then descend at the target x.
  if (Math.abs(targetX - state.x) > 300) {
    await moveStepwise(state.x, 40);
    await moveStepwise(targetX, 40);
    await moveStepwise(targetX, targetY);
  } else {
    await moveStepwise(targetX, targetY);
  }
  await wait(120);
}
