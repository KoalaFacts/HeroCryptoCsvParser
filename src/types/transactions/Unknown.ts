import type { BaseTransaction } from "./BaseTransaction";

export interface Unknown extends BaseTransaction {
	type: "UNKNOWN";
}
