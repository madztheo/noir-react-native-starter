export type ParameterKind = 'string' | 'array' | 'struct' | 'field' | 'integer';

export type ParameterType = {
  kind: ParameterKind;
  length?: number;
  type?: ParameterType;
  fields?: Parameter[];
};

export type Parameter = {
  name: string;
  type: ParameterType;
  visibility: 'private' | 'public';
};

export type Circuit = {
  noir_version: `${number}.${number}.${number}+${string}`;
  hash: number;
  abi: {
    parameters: Parameter[];
    param_witnesses: {
      [key: string]: {start: number; end: number}[];
    };
    return_type: any;
    return_witnesses: any[];
    error_types: any;
  };
  bytecode: string;
  debug_symbols: string;
  file_map: {
    [key: string]: {
      source: string;
      path: string;
    };
  };
  names: string[];
};
