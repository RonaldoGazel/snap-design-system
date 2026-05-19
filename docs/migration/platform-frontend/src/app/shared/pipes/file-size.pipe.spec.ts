import { describe, expect, it } from 'vitest';

import { FileSizePipe } from './file-size.pipe';

describe('FileSizePipe', () => {
  const pipe = new FileSizePipe();

  it('should return "-" for null', () => {
    expect(pipe.transform(null)).toBe('-');
  });

  it('should return "-" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('-');
  });

  it('should return "0 B" for 0', () => {
    expect(pipe.transform(0)).toBe('0 B');
  });

  it('should format bytes', () => {
    expect(pipe.transform(500)).toBe('500.0 B');
  });

  it('should format kilobytes', () => {
    expect(pipe.transform(1024)).toBe('1.0 KB');
  });

  it('should format megabytes', () => {
    expect(pipe.transform(1048576)).toBe('1.0 MB');
  });

  it('should format gigabytes', () => {
    expect(pipe.transform(1073741824)).toBe('1.0 GB');
  });

  it('should format terabytes', () => {
    expect(pipe.transform(1099511627776)).toBe('1.0 TB');
  });

  it('should format fractional sizes with 1 decimal', () => {
    expect(pipe.transform(1536)).toBe('1.5 KB');
  });
});
