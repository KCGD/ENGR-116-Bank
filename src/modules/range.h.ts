export type Enumerate<size extends number, array extends number[] = []> = array['length'] extends size
  ? array[number]
  : Enumerate<size, [...array, array['length']]>;

export type Range<LBound extends number, UBound extends number> = Exclude<Enumerate<UBound>, Enumerate<LBound>>;