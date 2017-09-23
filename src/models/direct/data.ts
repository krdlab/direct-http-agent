
export class Domain {
  id: string;
  name: string;
  constructor(id: string, name: string) {
    this.id = id;
    this.name = id;
  }
};

export class Talk {
  id: string;
  name: string;
  type: string;
  userIds: string[];
  constructor(id: string, name: string, type: string, userIds: string[]) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.userIds = userIds;
  }
};