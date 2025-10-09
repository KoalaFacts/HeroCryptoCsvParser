/**
 * Pipeline context passed through the chain
 * Contains the data and metadata about the current processing
 */
export interface PipelineContext<T> {
	data: T | null;
	metadata?: {
		lineNumber?: number;
		source?: string;
		[key: string]: any;
	};
}
