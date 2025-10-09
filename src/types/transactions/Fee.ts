import type { AssetAmount } from "../common/AssetAmount";
import type { BaseTransaction } from "./BaseTransaction";

export interface Fee extends BaseTransaction {
	type: "FEE";

	// Fee details
	fee: AssetAmount;

	// Fee context
	feeType: "trading" | "network" | "platform" | "other";
	relatedTransactionId?: string;
	description?: string;
}
