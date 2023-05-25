export enum Movement {
    STAY = 0x0,
    LEFT = 0x1,     // 001
    RIGHT = 0x2,    // 010
    UP = 0x4,       // 100
    UP_LEFT = 0x5,  // 101
    UP_RIGHT = 0x6  // 110
}

export interface MovementRef {
    move: Movement;
}

export function setLeft(moveRef: MovementRef) {
    moveRef.move |= Movement.LEFT;
    resetRight(moveRef); // implies
}

export function resetLeft(moveRef: MovementRef) {
    moveRef.move &= ~(Movement.LEFT);
}

export function setRight(moveRef: MovementRef) {
    moveRef.move |= Movement.RIGHT;
    resetLeft(moveRef); // implies
}

export function resetRight(moveRef: MovementRef) {
    moveRef.move &= ~(Movement.RIGHT);
}

export function setUp(moveRef: MovementRef) {
    moveRef.move |= Movement.UP;
}

export function resetUp(moveRef: MovementRef) {
    moveRef.move &= ~(Movement.UP);
}

export function resetAll(moveRef: MovementRef) {
    moveRef.move = Movement.STAY;
}