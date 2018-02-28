
export class Domain {
  constructor(private readonly id: string, private readonly name: string) {
  }
}

export class Talk {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly type: string,
    private readonly userIds: string[]
  ) {
  }
}