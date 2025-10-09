import type {
	SourceProcessResult,
	Transaction,
} from "@beingciteable/hero-csv-crypto-parser";
import { process } from "@beingciteable/hero-csv-crypto-parser";
import type { TaxReport } from "@beingciteable/hero-csv-crypto-parser/tax";
import {
	exportSummaryToCSV,
	generateTaxReport,
} from "@beingciteable/hero-csv-crypto-parser/tax";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import jsPDF from "jspdf";
import { useCallback, useEffect, useState } from "react";
import { generateSampleCSV } from "./utils/generateSampleData";

// Helper functions to safely extract properties from different transaction types
const getTransactionAsset = (tx: Transaction): string => {
	// Helper to extract asset symbol from AssetAmount or Asset
	const extractAsset = (field: any): string | null => {
		if (!field) return null;

		// If it's an AssetAmount object, extract the asset
		if (typeof field === "object" && field !== null && "asset" in field) {
			const asset = field.asset;
			if (typeof asset === "string") return asset;
			if (asset && typeof asset === "object" && "symbol" in asset) {
				return asset.symbol || null;
			}
		}

		// If it's an Asset object with symbol
		if (typeof field === "object" && field !== null && "symbol" in field) {
			return field.symbol || null;
		}

		// If it's a string
		if (typeof field === "string") return field;

		return null;
	};

	// Try different field names based on transaction type
	const fields = [
		"fee", // Fee
		"reward", // StakingReward
		"interest", // Interest
		"received", // Airdrop
		"asset", // Transfer, StakingDeposit, StakingWithdrawal
		"baseAsset", // SpotTrade
		"fromAsset", // Swap
		"toAsset", // Swap
	];

	for (const fieldName of fields) {
		if (fieldName in tx) {
			const result = extractAsset((tx as any)[fieldName]);
			if (result) return result;
		}
	}

	return "N/A";
};

const getTransactionQuoteAsset = (tx: Transaction): string | undefined => {
	if ("quoteAsset" in tx && tx.quoteAsset) {
		// AssetAmount type
		if (
			typeof tx.quoteAsset === "object" &&
			tx.quoteAsset !== null &&
			"asset" in tx.quoteAsset
		) {
			const asset = (tx.quoteAsset as any).asset;
			if (!asset) return undefined;
			return typeof asset === "string" ? asset : asset.symbol || String(asset);
		}
		return typeof tx.quoteAsset === "string"
			? tx.quoteAsset
			: String(tx.quoteAsset);
	}
	return undefined;
};

const getTransactionAmount = (tx: Transaction): string => {
	// Helper to extract amount from AssetAmount
	const extractAmount = (field: any): string | null => {
		if (!field) return null;
		if (typeof field === "object" && field !== null && "amount" in field) {
			return field.amount?.toString() || null;
		}
		if (typeof field === "object" && field !== null && "toString" in field) {
			return field.toString();
		}
		return String(field);
	};

	// Try different field names based on transaction type
	const fields = [
		"fee", // Fee
		"reward", // StakingReward
		"interest", // Interest
		"received", // Airdrop
		"asset", // Transfer, StakingDeposit, StakingWithdrawal
		"baseAsset", // SpotTrade
		"amount", // Generic
		"baseAmount",
		"fromAmount",
		"toAmount",
	];

	for (const fieldName of fields) {
		if (fieldName in tx) {
			const result = extractAmount((tx as any)[fieldName]);
			if (result) return result;
		}
	}

	return "N/A";
};

const getTransactionPrice = (tx: Transaction): string | undefined => {
	if ("price" in tx && tx.price) {
		const priceStr = tx.price.toString();
		// Only return if price is not zero
		if (priceStr !== "0" && priceStr !== "0.0" && priceStr !== "0.00") {
			return priceStr;
		}
	}
	return undefined;
};

const getTransactionFee = (
	tx: Transaction,
): { amount?: string; asset?: string } => {
	if ("feeAmount" in tx && "feeAsset" in tx && tx.feeAmount && tx.feeAsset) {
		return {
			amount: tx.feeAmount.toString(),
			asset:
				typeof tx.feeAsset === "string" ? tx.feeAsset : tx.feeAsset.toString(),
		};
	}
	return {};
};

function App() {
	const [selectedSource, setSelectedSource] = useState("binance");
	const [csvInput, setCsvInput] = useState("");
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
	const currentYear = new Date().getFullYear();
	const [taxYear, setTaxYear] = useState(currentYear);
	const [generatingTaxReport, setGeneratingTaxReport] = useState(false);

	// Generate last 10 financial years dynamically
	const financialYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

	const handleProcess = useCallback(async (source: string, input: string) => {
		if (!input.trim()) {
			setTransactions([]);
			setError("");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const result: SourceProcessResult = await process(source, input);
			setTransactions(result.transactions);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Processing failed");
			setTransactions([]);
		} finally {
			setLoading(false);
		}
	}, []);

	// Auto-process when CSV input or source changes
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			handleProcess(selectedSource, csvInput);
		}, 500); // Debounce for 500ms

		return () => clearTimeout(timeoutId);
	}, [csvInput, selectedSource, handleProcess]);

	const handleExport = async () => {
		if (transactions.length === 0) return;

		try {
			// Simple CSV export
			const headers = ["Timestamp", "Type", "Asset", "Amount", "Fee"];
			const rows = transactions.map((tx) => {
				const fee = getTransactionFee(tx);
				return [
					tx.timestamp,
					tx.type,
					getTransactionAsset(tx),
					getTransactionAmount(tx),
					fee.amount ? `${fee.amount} ${fee.asset}` : "N/A",
				];
			});

			const csv = [headers, ...rows]
				.map((row) => row.map((cell) => `"${cell}"`).join(","))
				.join("\n");

			const blob = new Blob([csv], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${selectedSource}-transactions-${new Date().toISOString().split("T")[0]}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (_err) {
			setError("Export failed");
		}
	};

	const handleGenerateTaxReport = async () => {
		if (transactions.length === 0) return;

		setGeneratingTaxReport(true);
		setError("");

		try {
			const report = await generateTaxReport({
				jurisdictionCode: "AU",
				taxYear,
				transactions,
				options: {
					includeOptimization: true,
					costBasisMethod: "FIFO",
					handleDeFi: true,
				},
			});

			setTaxReport(report);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Tax report generation failed",
			);
			setTaxReport(null);
		} finally {
			setGeneratingTaxReport(false);
		}
	};

	const handleExportTaxReportPDF = () => {
		if (!taxReport) return;

		try {
			const doc = new jsPDF();

			// Title
			doc.setFontSize(20);
			doc.text("Australian Tax Report", 20, 20);

			// Tax Year
			doc.setFontSize(12);
			doc.text(
				`Financial Year: ${taxYear}-${(taxYear + 1).toString().slice(-2)}`,
				20,
				30,
			);
			doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 37);

			// Summary Section
			doc.setFontSize(16);
			doc.text("Tax Summary", 20, 50);

			doc.setFontSize(11);
			let yPos = 60;

			doc.text(
				`Capital Gains: $${taxReport.summary.totalCapitalGains.toLocaleString()}`,
				20,
				yPos,
			);
			yPos += 7;
			doc.text(
				`CGT Discount (50%): $${taxReport.summary.cgtDiscount.toLocaleString()}`,
				20,
				yPos,
			);
			yPos += 7;
			doc.text(
				`Ordinary Income: $${taxReport.summary.ordinaryIncome.toLocaleString()}`,
				20,
				yPos,
			);
			yPos += 7;
			doc.text(
				`Net Taxable Amount: $${taxReport.summary.netTaxableAmount.toLocaleString()}`,
				20,
				yPos,
			);
			yPos += 15;

			// Asset Summary
			doc.setFontSize(16);
			doc.text("Assets Summary", 20, yPos);
			yPos += 10;

			doc.setFontSize(10);
			const assetEntries = Array.from(taxReport.summary.byAsset.entries());
			for (const [asset, summary] of assetEntries.slice(0, 15)) {
				// Limit to first 15 assets
				doc.text(
					`${asset}: Gain $${summary.netGain.toFixed(2)} | Loss $${summary.netLoss.toFixed(2)}`,
					25,
					yPos,
				);
				yPos += 6;
				if (yPos > 270) break; // Page limit
			}

			// Footer
			doc.setFontSize(8);
			doc.text("Generated with Hero Crypto CSV Parser", 20, 285);
			doc.text("https://github.com/BeingCiteable/HeroCryptoCsvParser", 20, 290);

			// Save
			doc.save(`tax-report-AU-${taxYear}.pdf`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "PDF export failed");
		}
	};

	const handleExportTaxReportCSV = async () => {
		if (!taxReport) return;

		try {
			const csv = exportSummaryToCSV(taxReport);

			const blob = new Blob([csv], { type: "text/csv" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `tax-summary-AU-${taxYear}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			setError(err instanceof Error ? err.message : "CSV export failed");
		}
	};

	const handleLoadSample = async () => {
		setLoading(true);
		setError("");

		try {
			// Simulate loading effect for better UX
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Generate sample data dynamically based on selected source
			let sampleData: string;

			if (selectedSource === "binance") {
				sampleData = generateSampleCSV();
			} else {
				// For other exchanges (not yet implemented), show a message
				setError(
					`Sample data for ${selectedSource} is not yet available. Showing Binance sample instead.`,
				);
				sampleData = generateSampleCSV();
			}

			setCsvInput(sampleData);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to generate sample data",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-100 via-base-100 to-base-200">
			{/* Page content */}
			<div className="flex flex-col">
				{/* Navbar */}
				<div className="bg-white/95 backdrop-blur-md border-b border-base-300/50 w-full sticky top-0 z-50">
					<div className="max-w-full mx-auto px-6">
						<div className="flex items-center justify-between h-16">
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
									<svg
										className="w-4 h-4 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>
								</div>
								<div>
									<span className="font-bold text-lg text-base-content">
										Hero Crypto CSV Parser
									</span>
									<div className="inline-flex items-center ml-3 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
										DEMO
									</div>
								</div>
							</div>
							<div className="flex items-center space-x-4">
								<div className="hidden sm:flex items-center space-x-3">
									<a
										href="https://github.com/BeingCiteable/HeroCryptoCsvParser"
										className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-base-content/60 hover:text-base-content transition-colors duration-200"
									>
										<svg
											className="w-4 h-4 mr-2"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
										</svg>
										GitHub
									</a>
									<a
										href="https://www.npmjs.com/package/@beingciteable/hero-csv-crypto-parser"
										className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-base-content/60 hover:text-base-content transition-colors duration-200"
									>
										<svg
											className="w-4 h-4 mr-2"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H8.595l-.01-10.383H5.113z" />
										</svg>
										npm
									</a>
								</div>
								<div className="relative">
									<button className="p-2 rounded-xl hover:bg-base-200/50 transition-colors duration-200">
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1">
					<div className="max-w-full mx-auto">
						{/* Main Processing Interface */}
						<div className="p-6">
							<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
								{/* Left Panel - CSV Input */}
								<div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-base-300/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-full">
									<div className="p-8 flex flex-col h-full">
										<div className="flex items-center justify-between mb-6">
											<div className="flex items-center space-x-3">
												<div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
													<svg
														className="w-5 h-5 text-white"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth="2"
															d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
												</div>
												<div>
													<h2 className="text-2xl font-bold text-base-content">
														CSV Input
													</h2>
													<p className="text-base-content/60 font-medium">
														Paste your transaction data
													</p>
												</div>
											</div>

											<div className="form-control">
												<select
													className="select select-lg bg-white border-2 border-primary/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-lg font-semibold min-w-[240px] shadow-lg hover:shadow-xl"
													value={selectedSource}
													onChange={(e) => setSelectedSource(e.target.value)}
												>
													<option value="binance">Binance Exchange</option>
													<option value="coinbase" disabled>
														Coinbase (Coming Soon)
													</option>
													<option value="kraken" disabled>
														Kraken (Coming Soon)
													</option>
													<option value="kucoin" disabled>
														KuCoin (Coming Soon)
													</option>
												</select>
											</div>
										</div>

										<div className="form-control flex-1 flex flex-col">
											<div className="mb-4">
												<div className="flex items-center justify-between">
													<label className="text-base font-semibold text-base-content">
														Transaction Data
													</label>
													<div className="flex items-center space-x-2">
														<div className="px-3 py-1 bg-info/10 text-info rounded-full text-xs font-medium">
															CSV Format
														</div>
														{csvInput && (
															<div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
																{csvInput.split("\n").length - 1} rows
															</div>
														)}
														{loading && (
															<div className="px-3 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium flex items-center">
																<span className="loading loading-spinner loading-xs mr-1"></span>
																Processing
															</div>
														)}
													</div>
												</div>
											</div>
											<div className="relative flex-1">
												<textarea
													className="w-full h-full min-h-[500px] p-4 bg-base-100/50 border border-base-300 rounded-xl font-mono text-sm resize-none overflow-auto focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-base-content/40"
													placeholder={`Paste your ${selectedSource} CSV data here...\n\nExample format:\nUTC_Time,Account,Operation,Coin,Change,Remark\n2023-01-01 00:00:00,Spot,Buy,BTC,0.001,""\n2023-01-01 00:01:00,Spot,Sell,BTC,-0.001,""`}
													value={csvInput}
													onChange={(e) => setCsvInput(e.target.value)}
												/>
												{!csvInput && (
													<div className="absolute inset-0 pointer-events-none">
														<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
															<div className="w-16 h-16 bg-base-300/20 rounded-full flex items-center justify-center mb-3 mx-auto">
																<svg
																	className="w-8 h-8 text-base-content/30"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth="2"
																		d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																	/>
																</svg>
															</div>
															<p className="text-base-content/40 font-medium">
																Paste your CSV data
															</p>
														</div>
													</div>
												)}
											</div>
										</div>

										<div className="flex justify-between items-center mt-6">
											<div className="flex items-center space-x-3">
												{!csvInput && (
													<button
														type="button"
														className="inline-flex items-center px-4 py-2 bg-secondary/10 text-secondary rounded-xl font-medium hover:bg-secondary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
														onClick={handleLoadSample}
														disabled={loading}
													>
														{loading ? (
															<>
																<span className="loading loading-spinner loading-sm mr-2"></span>
																Generating...
															</>
														) : (
															<>
																<svg
																	className="w-4 h-4 mr-2"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth="2"
																		d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
																	/>
																</svg>
																Load Sample Data
															</>
														)}
													</button>
												)}
												{csvInput && (
													<button
														type="button"
														className="inline-flex items-center px-4 py-2 text-sm font-medium text-base-content/70 hover:text-base-content transition-colors duration-200"
														onClick={() => setCsvInput("")}
													>
														<svg
															className="w-4 h-4 mr-2"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
															/>
														</svg>
														Clear
													</button>
												)}
											</div>
											<div className="inline-flex items-center px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
												<div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
												Auto-processing enabled
											</div>
										</div>

										{error && (
											<div className="mt-6 p-4 bg-error/10 border border-error/20 rounded-xl">
												<div className="flex items-start space-x-3">
													<div className="w-5 h-5 text-error mt-0.5">
														<svg
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</div>
													<div>
														<h4 className="font-semibold text-error mb-1">
															Processing Error
														</h4>
														<p className="text-sm text-error/80">{error}</p>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Right Panel - Parsed Transactions */}
								<div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-base-300/50 shadow-xl hover:shadow-2xl transition-all duration-300 h-full relative">
									{loading && (
										<>
											<div className="absolute inset-0 bg-gray-400/20 rounded-2xl z-10 transition-opacity duration-200"></div>
											<div className="absolute top-4 right-4 z-20">
												<span className="loading loading-spinner loading-md text-primary"></span>
											</div>
										</>
									)}
									<div className="p-8 flex flex-col h-full">
										<div className="flex justify-between items-center mb-6">
											<div className="flex items-center space-x-3">
												<div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/70 rounded-xl flex items-center justify-center">
													<svg
														className="w-5 h-5 text-white"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth="2"
															d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
														/>
													</svg>
												</div>
												<div>
													<h2 className="text-2xl font-bold text-base-content">
														Parsed Transactions
													</h2>
													<p className="text-base-content/60 font-medium">
														Processed and categorized data
													</p>
												</div>
											</div>
											{transactions.length > 0 && (
												<button
													type="button"
													className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
													onClick={handleExport}
												>
													<svg
														className="w-4 h-4 mr-2"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth="2"
															d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
													Export CSV
												</button>
											)}
										</div>

										{transactions.length === 0 ? (
											<div className="flex flex-col items-center justify-center flex-1 text-center py-12">
												<div className="relative mb-8">
													<div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
														<svg
															className="w-10 h-10 text-primary/70"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
															/>
														</svg>
													</div>
													<div className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center animate-pulse">
														<div className="w-2 h-2 bg-white rounded-full"></div>
													</div>
												</div>
												<h3 className="text-2xl font-bold mb-3 text-base-content">
													Ready to Process
												</h3>
												<p className="text-base-content/60 mb-8 max-w-md leading-relaxed">
													Paste your transaction data in the panel to see
													instant processing and smart categorization
												</p>
												<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md">
													<div className="p-4 bg-success/10 rounded-xl border border-success/20">
														<div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center mb-2 mx-auto">
															<svg
																className="w-4 h-4 text-success"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
																/>
															</svg>
														</div>
														<p className="text-xs font-medium text-success text-center">
															Smart AI
														</p>
													</div>
													<div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
														<div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mb-2 mx-auto">
															<svg
																className="w-4 h-4 text-primary"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M13 10V3L4 14h7v7l9-11h-7z"
																/>
															</svg>
														</div>
														<p className="text-xs font-medium text-primary text-center">
															150+ Patterns
														</p>
													</div>
													<div className="p-4 bg-warning/10 rounded-xl border border-warning/20">
														<div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center mb-2 mx-auto">
															<svg
																className="w-4 h-4 text-warning"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
																/>
															</svg>
														</div>
														<p className="text-xs font-medium text-warning text-center">
															Tax Ready
														</p>
													</div>
												</div>
											</div>
										) : (
											<>
												{/* Stats */}
												<div className="grid grid-cols-3 gap-4 mb-8">
													<div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
														<div className="flex items-center justify-between">
															<div>
																<p className="text-sm font-medium text-primary/70">
																	Transactions
																</p>
																<p className="text-2xl font-bold text-primary">
																	{transactions.length}
																</p>
															</div>
															<div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
																<svg
																	className="w-5 h-5 text-primary"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth="2"
																		d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
																	/>
																</svg>
															</div>
														</div>
													</div>
													<div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-xl p-4 border border-secondary/10">
														<div className="flex items-center justify-between">
															<div>
																<p className="text-sm font-medium text-secondary/70">
																	Assets
																</p>
																<p className="text-2xl font-bold text-secondary">
																	{
																		new Set(
																			transactions.map((t) =>
																				getTransactionAsset(t),
																			),
																		).size
																	}
																</p>
															</div>
															<div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
																<svg
																	className="w-5 h-5 text-secondary"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth="2"
																		d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
																	/>
																</svg>
															</div>
														</div>
													</div>
													<div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 border border-accent/10">
														<div className="flex items-center justify-between">
															<div>
																<p className="text-sm font-medium text-accent/70">
																	Types
																</p>
																<p className="text-2xl font-bold text-accent">
																	{
																		new Set(transactions.map((t) => t.type))
																			.size
																	}
																</p>
															</div>
															<div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
																<svg
																	className="w-5 h-5 text-accent"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth="2"
																		d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
																	/>
																</svg>
															</div>
														</div>
													</div>
												</div>

												{/* Transaction Table */}
												<div className="flex-1 bg-base-100/50 rounded-xl border border-base-300/50 overflow-hidden">
													<div className="overflow-x-auto max-h-96">
														<table className="w-full">
															<thead className="sticky top-0 bg-white/85 backdrop-blur-lg border-b-2 border-gray-300 shadow-sm z-10">
																<tr>
																	<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
																		Time
																	</th>
																	<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
																		Type
																	</th>
																	<th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
																		Asset
																	</th>
																	<th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
																		Amount
																	</th>
																</tr>
															</thead>
															<tbody>
																{transactions.map((tx, index) => (
																	<tr
																		key={index}
																		className="border-b border-base-300/30 hover:bg-base-200/30 transition-all duration-200 animate-fadeIn"
																		style={{
																			animationDelay: `${Math.min(index * 20, 500)}ms`,
																		}}
																	>
																		<td className="px-6 py-4">
																			<div className="flex flex-col">
																				<span className="font-mono text-sm font-medium text-base-content">
																					{
																						new Date(tx.timestamp)
																							.toISOString()
																							.split("T")[0]
																					}
																				</span>
																				<span className="font-mono text-xs text-base-content/60">
																					{
																						new Date(tx.timestamp)
																							.toISOString()
																							.split("T")[1]
																							.split(".")[0]
																					}{" "}
																					UTC
																				</span>
																			</div>
																		</td>
																		<td className="px-6 py-4">
																			<span
																				className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
																					tx.type.includes("BUY") ||
																					tx.type.includes("DEPOSIT")
																						? "bg-green-50 text-green-700 border border-green-200"
																						: tx.type.includes("SELL") ||
																								tx.type.includes("WITHDRAWAL")
																							? "bg-red-50 text-red-700 border border-red-200"
																							: tx.type.includes("FEE")
																								? "bg-amber-50 text-amber-700 border border-amber-200"
																								: "bg-blue-50 text-blue-700 border border-blue-200"
																				}`}
																			>
																				{tx.type}
																			</span>
																		</td>
																		<td className="px-6 py-4">
																			<div>
																				<span className="font-mono font-semibold text-base-content">
																					{getTransactionAsset(tx)}
																				</span>
																				{getTransactionQuoteAsset(tx) && (
																					<span className="text-xs text-base-content/50 ml-1">
																						/{getTransactionQuoteAsset(tx)}
																					</span>
																				)}
																			</div>
																		</td>
																		<td className="px-6 py-4 text-right">
																			<div className="flex flex-col items-end">
																				<span className="font-mono font-semibold text-base-content">
																					{getTransactionAmount(tx)}
																				</span>
																				{getTransactionPrice(tx) && (
																					<span className="font-mono text-xs text-base-content/50">
																						@ {getTransactionPrice(tx)}
																					</span>
																				)}
																			</div>
																		</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												</div>

												{/* Tax Report Section - Enhanced */}
												<div className="mt-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-emerald-300/50 shadow-xl">
													<div className="flex items-center justify-between mb-6 flex-wrap gap-4">
														<div className="flex items-center space-x-4">
															<div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
																<svg
																	className="w-7 h-7 text-white"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth="2"
																		d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
																	/>
																</svg>
															</div>
															<div>
																<h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
																	🇦🇺 Australian Tax Report
																	<span className="text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-md">
																		NEW FEATURE
																	</span>
																</h3>
																<p className="text-base text-gray-700 mt-1 font-medium">
																	Generate ATO-compliant tax reports with CGT
																	discount calculations
																</p>
															</div>
														</div>
														<div className="flex items-center gap-4">
															<div className="flex flex-col">
																<label className="text-xs font-semibold text-gray-600 mb-1">
																	Financial Year
																</label>
																<select
																	className="select select-lg select-bordered bg-white border-2 border-emerald-300 focus:border-emerald-500 focus:outline-none text-base font-semibold shadow-md hover:shadow-lg transition-all"
																	value={taxYear}
																	onChange={(e) =>
																		setTaxYear(Number(e.target.value))
																	}
																>
																	{financialYears.map((year) => (
																		<option key={year} value={year}>
																			FY {year}-
																			{(year + 1).toString().slice(-2)}
																		</option>
																	))}
																</select>
															</div>
															<button
																type="button"
																className="btn btn-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none shadow-xl hover:shadow-2xl transition-all duration-200 mt-5"
																onClick={handleGenerateTaxReport}
																disabled={
																	generatingTaxReport ||
																	transactions.length === 0
																}
															>
																{generatingTaxReport ? (
																	<>
																		<span className="loading loading-spinner loading-md"></span>
																		Generating...
																	</>
																) : (
																	<>
																		<svg
																			className="w-5 h-5"
																			fill="none"
																			stroke="currentColor"
																			viewBox="0 0 24 24"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth="2"
																				d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
																			/>
																		</svg>
																		Generate Report
																	</>
																)}
															</button>
														</div>
													</div>

													{taxReport && (
														<div className="bg-white rounded-lg p-5 border border-emerald-200/50">
															<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
																<div className="bg-emerald-50 rounded-lg p-3">
																	<p className="text-xs text-emerald-700 font-medium mb-1">
																		Capital Gains
																	</p>
																	<p className="text-lg font-bold text-emerald-900">
																		$
																		{taxReport.summary.totalCapitalGains.toLocaleString()}
																	</p>
																</div>
																<div className="bg-amber-50 rounded-lg p-3">
																	<p className="text-xs text-amber-700 font-medium mb-1">
																		CGT Discount
																	</p>
																	<p className="text-lg font-bold text-amber-900">
																		$
																		{taxReport.summary.cgtDiscount.toLocaleString()}
																	</p>
																</div>
																<div className="bg-blue-50 rounded-lg p-3">
																	<p className="text-xs text-blue-700 font-medium mb-1">
																		Ordinary Income
																	</p>
																	<p className="text-lg font-bold text-blue-900">
																		$
																		{taxReport.summary.ordinaryIncome.toLocaleString()}
																	</p>
																</div>
																<div className="bg-purple-50 rounded-lg p-3">
																	<p className="text-xs text-purple-700 font-medium mb-1">
																		Net Taxable
																	</p>
																	<p className="text-lg font-bold text-purple-900">
																		$
																		{taxReport.summary.netTaxableAmount.toLocaleString()}
																	</p>
																</div>
															</div>

															<div className="flex gap-3 flex-wrap">
																<button
																	type="button"
																	className="btn btn-md bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200"
																	onClick={handleExportTaxReportPDF}
																>
																	<svg
																		className="w-5 h-5"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth="2"
																			d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
																		/>
																	</svg>
																	<span className="font-semibold">
																		Export as PDF
																	</span>
																</button>
																<button
																	type="button"
																	className="btn btn-md bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200"
																	onClick={handleExportTaxReportCSV}
																>
																	<svg
																		className="w-5 h-5"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth="2"
																			d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																		/>
																	</svg>
																	<span className="font-semibold">
																		Export as CSV
																	</span>
																</button>
															</div>
														</div>
													)}
												</div>
											</>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Features */}
						<div className="mt-16 px-6">
							<div className="text-center mb-12">
								<h2 className="text-3xl font-bold text-base-content mb-4">
									Why Choose Hero Crypto Parser?
								</h2>
								<p className="text-lg text-base-content/60 max-w-2xl mx-auto">
									Built with privacy, performance, and professional standards in
									mind
								</p>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
								<div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-base-300/50 hover:border-success/30 hover:shadow-xl transition-all duration-300">
									<div className="absolute inset-0 bg-gradient-to-br from-success/5 to-success/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative">
										<div className="w-14 h-14 bg-gradient-to-br from-success/20 to-success/30 rounded-xl flex items-center justify-center mb-6">
											<svg
												className="w-7 h-7 text-success"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-base-content mb-3">
											Privacy First
										</h3>
										<p className="text-base-content/70 leading-relaxed">
											All processing happens locally in your browser. Your
											sensitive financial data never leaves your device.
										</p>
									</div>
								</div>
								<div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-base-300/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
									<div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative">
										<div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/30 rounded-xl flex items-center justify-center mb-6">
											<svg
												className="w-7 h-7 text-primary"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M13 10V3L4 14h7v7l9-11h-7z"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-base-content mb-3">
											Lightning Fast
										</h3>
										<p className="text-base-content/70 leading-relaxed">
											Process thousands of transactions in seconds with our
											optimized parsing engine and smart categorization.
										</p>
									</div>
								</div>
								<div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-base-300/50 hover:border-warning/30 hover:shadow-xl transition-all duration-300">
									<div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-warning/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									<div className="relative">
										<div className="w-14 h-14 bg-gradient-to-br from-warning/20 to-warning/30 rounded-xl flex items-center justify-center mb-6">
											<svg
												className="w-7 h-7 text-warning"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-base-content mb-3">
											Tax Ready
										</h3>
										<p className="text-base-content/70 leading-relaxed">
											Export standardized data compatible with popular tax
											software and accounting tools for seamless reporting.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Two Column Layout for Large Screens */}
						<div className="mt-16 px-6">
							<div className="grid lg:grid-cols-3 gap-8">
								{/* NEW: Tax Reporting Feature - Takes 2/3 width */}
								<div className="lg:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 lg:p-12 rounded-2xl overflow-hidden relative">
									<div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>

									<div className="relative">
										{/* Header */}
										<div className="text-center mb-8">
											<h2 className="text-3xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
												🇦🇺 Australian Tax Reports
												<span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
													🆕 NEW
												</span>
											</h2>
											<p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
												Privacy-first cryptocurrency tax reporting. Generate
												ATO-compliant reports entirely on your device - no data
												ever leaves your browser.
											</p>
										</div>

										{/* Two-column: Code Example + CTA/Features */}
										<div className="grid lg:grid-cols-2 gap-6">
											{/* Left: Code Example */}
											<div>
												<div className="bg-gray-900 rounded-2xl p-5 overflow-hidden h-full">
													<div className="flex items-center justify-between mb-3">
														<span className="text-emerald-400 font-mono text-xs">
															tax-report.ts
														</span>
														<span className="text-gray-500 text-xs">
															TypeScript
														</span>
													</div>
													<pre className="text-xs text-gray-300 overflow-x-auto leading-relaxed">
														{`import { generateTaxReport } from
 'hero-crypto-csv-parser/tax';

const report = await generateTaxReport({
  jurisdictionCode: 'AU',
  taxYear: 2024,
  transactions: myTransactions
});

// Capital gains, CGT discounts,
// net taxable amount - all calculated
console.log(report.summary);`}
													</pre>
												</div>
											</div>

											{/* Right: Features & CTA */}
											<div className="space-y-6">
												{/* Key Features */}
												<div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/30">
													<h3 className="text-lg font-bold text-gray-900 mb-4">
														Key Features
													</h3>
													<div className="space-y-3">
														<div className="flex items-start space-x-2">
															<svg
																className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M5 13l4 4L19 7"
																/>
															</svg>
															<span className="text-sm text-gray-900">
																<strong>100% Privacy</strong> - Zero external
																API calls
															</span>
														</div>
														<div className="flex items-start space-x-2">
															<svg
																className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M5 13l4 4L19 7"
																/>
															</svg>
															<span className="text-sm text-gray-900">
																<strong>ATO Compliant</strong> - CGT discount &
																FIFO
															</span>
														</div>
														<div className="flex items-start space-x-2">
															<svg
																className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M5 13l4 4L19 7"
																/>
															</svg>
															<span className="text-sm text-gray-900">
																<strong>Lightning Fast</strong> - 100k+ tx in
																&lt;30s
															</span>
														</div>
														<div className="flex items-start space-x-2">
															<svg
																className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M5 13l4 4L19 7"
																/>
															</svg>
															<span className="text-sm text-gray-900">
																<strong>DeFi Support</strong> - Staking, yield,
																LP tokens
															</span>
														</div>
														<div className="flex items-start space-x-2">
															<svg
																className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M5 13l4 4L19 7"
																/>
															</svg>
															<span className="text-sm text-gray-900">
																<strong>PDF & ATO XML</strong> - Professional
																reports
															</span>
														</div>
														<div className="flex items-start space-x-2">
															<svg
																className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth="2"
																	d="M5 13l4 4L19 7"
																/>
															</svg>
															<span className="text-sm text-gray-900">
																<strong>Tax Optimization</strong> - 5 strategy
																types
															</span>
														</div>
													</div>
												</div>

												{/* CTA Buttons */}
												<div className="flex flex-col gap-3">
													<a
														href="https://github.com/BeingCiteable/HeroCryptoCsvParser#-tax-reporting-new"
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
													>
														<svg
															className="w-4 h-4 mr-2"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
															/>
														</svg>
														Read Documentation
													</a>
													<a
														href="https://github.com/BeingCiteable/HeroCryptoCsvParser/tree/main/docs"
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center justify-center px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-200 border border-emerald-200 text-sm"
													>
														<svg
															className="w-4 h-4 mr-2"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
															/>
														</svg>
														View Examples
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Community Contribution Section - Takes 1/3 width */}
								<div className="relative bg-gradient-to-br from-orange-50 to-amber-50 p-8 lg:p-12 rounded-2xl border border-orange-200/50">
									<div className="absolute top-6 right-6">
										<div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
											<svg
												className="w-6 h-6 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
												/>
											</svg>
										</div>
									</div>

									<div className="text-center">
										<h2 className="text-3xl font-bold text-gray-900 mb-3">
											Help Us Support Your Exchange
										</h2>
										<p className="text-lg text-gray-700 mb-6 leading-relaxed">
											We're building universal cryptocurrency parser support!
											Currently supporting <strong>Binance</strong> with 150+
											transaction patterns.
										</p>

										{/* Exchange Status Grid */}
										<div className="grid grid-cols-2 gap-3 mb-6">
											<div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-green-200">
												<div className="text-green-600 font-semibold text-sm mb-1">
													✅ Binance
												</div>
												<div className="text-xs text-gray-600">
													Full Support
												</div>
											</div>
											<div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-yellow-200">
												<div className="text-yellow-600 font-semibold text-sm mb-1">
													🔄 Coinbase
												</div>
												<div className="text-xs text-gray-600">In Progress</div>
											</div>
											<div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-blue-200">
												<div className="text-blue-600 font-semibold text-sm mb-1">
													📝 Kraken
												</div>
												<div className="text-xs text-gray-600">
													Samples Needed
												</div>
											</div>
											<div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-purple-200">
												<div className="text-purple-600 font-semibold text-sm mb-1">
													🚀 KuCoin
												</div>
												<div className="text-xs text-gray-600">
													Samples Needed
												</div>
											</div>
										</div>

										{/* How to Contribute */}
										<div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-orange-200/50 mb-6">
											<h3 className="text-base font-bold text-gray-900 mb-3">
												How to Contribute
											</h3>
											<div className="space-y-3 text-left">
												<div className="flex items-start space-x-2">
													<div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
														<span className="text-orange-600 font-bold text-xs">
															1
														</span>
													</div>
													<div>
														<h4 className="font-semibold text-gray-900 text-sm mb-1">
															Export Data
														</h4>
														<p className="text-gray-600 text-xs">
															Download CSV from exchange
														</p>
													</div>
												</div>
												<div className="flex items-start space-x-2">
													<div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
														<span className="text-orange-600 font-bold text-xs">
															2
														</span>
													</div>
													<div>
														<h4 className="font-semibold text-gray-900 text-sm mb-1">
															Anonymize
														</h4>
														<p className="text-gray-600 text-xs">
															Remove personal data
														</p>
													</div>
												</div>
												<div className="flex items-start space-x-2">
													<div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
														<span className="text-orange-600 font-bold text-xs">
															3
														</span>
													</div>
													<div>
														<h4 className="font-semibold text-gray-900 text-sm mb-1">
															Share
														</h4>
														<p className="text-gray-600 text-xs">
															Open GitHub issue
														</p>
													</div>
												</div>
											</div>
										</div>

										<div className="flex flex-col gap-3">
											<a
												href="https://github.com/BeingCiteable/HeroCryptoCsvParser/issues/new?assignees=&labels=exchange-request&template=exchange_support_request.md&title=Add+support+for+[Exchange+Name]"
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
											>
												<svg
													className="w-4 h-4 mr-2"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M12 6v6m0 0v6m0-6h6m-6 0H6"
													/>
												</svg>
												Submit Request
											</a>
											<a
												href="https://github.com/BeingCiteable/HeroCryptoCsvParser/discussions"
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-200 border border-orange-200 text-sm"
											>
												<svg
													className="w-4 h-4 mr-2"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
													/>
												</svg>
												Join Discussion
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="mt-16 px-6 relative overflow-hidden">
							<div className="inset-0 bg-gradient-to-r from-primary to-secondary rounded-3xl"></div>
							<div className="relative bg-gradient-to-r from-primary/95 to-secondary/95 rounded-3xl p-12 text-center">
								<h2 className="text-3xl font-bold text-white mb-6">
									Ready for Production?
								</h2>
								<p className="text-lg text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
									This demo showcases the Hero Crypto CSV Parser library.
									Integrate the npm package into your production applications
									for enterprise-grade transaction processing.
								</p>
								<div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
									<a
										href="https://github.com/BeingCiteable/HeroCryptoCsvParser"
										className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl"
									>
										<svg
											className="w-5 h-5 mr-3"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
										</svg>
										Star on GitHub
									</a>
									<a
										href="https://www.npmjs.com/package/@beingciteable/hero-csv-crypto-parser"
										className="inline-flex items-center px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20"
									>
										<svg
											className="w-5 h-5 mr-3"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H8.595l-.01-10.383H5.113z" />
										</svg>
										View on npm
									</a>
								</div>
							</div>
						</div>

						{/* Footer */}
						<footer className="mt-20 mx-6 mb-6 bg-gradient-to-r from-base-200/50 to-base-300/50 rounded-2xl p-12 text-center border border-base-300/30">
							<div className="max-w-4xl mx-auto">
								<div className="flex items-center justify-center space-x-3 mb-6">
									<div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
										<svg
											className="w-5 h-5 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										</svg>
									</div>
									<div>
										<h3 className="text-2xl font-bold text-base-content">
											Hero Crypto Parser
										</h3>
										<p className="text-base-content/60 font-medium">
											Professional Transaction Analysis
										</p>
									</div>
								</div>

								<div className="pt-6 border-t border-base-300/30">
									<p className="text-base-content/60">
										Built with passion by the crypto community • Open Source MIT
										License
									</p>
								</div>
							</div>
						</footer>
					</div>
				</div>
			</div>
			<SpeedInsights />
			<Analytics />
		</div>
	);
}

export default App;
