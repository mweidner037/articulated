import { Position } from "../src";

interface ListElement {
  pos: Position;
  isDeleted: boolean;
}

export class Strawman {
  private readonly state: ListElement[] = [];

  insertAfter(beforePos: Position, pos: Position) {
    const index = this.state.findIndex((element) =>
      equalsPosition(element.pos, pos)
    );
    this.state.splice(index + 1, 0, { pos, isDeleted: false });
  }
}
