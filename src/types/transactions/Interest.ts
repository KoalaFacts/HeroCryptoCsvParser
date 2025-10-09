import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface Interest extends BaseTransaction {
	type: "INTEREST";

	// Interest details
	interest: AssetAmount;
	interestType: "EARNED" | "PAID";

	// Context
	context: {
		protocol?: string;
		principal?: AssetAmount;
		rate?: string;
		period?: string; // e.g., "daily", "monthly"
	};
}
