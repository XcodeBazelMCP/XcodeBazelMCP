import { describe, expect, it } from 'vitest';
import { assertSwiftPackage, detectSwiftPackage } from './swift-package.js';

describe('Swift Package detection', () => {
  it('detects Package.swift presence', () => {
    const info = detectSwiftPackage('/tmp/nonexistent-dir-12345');
    expect(info.packagePath).toBe('/tmp/nonexistent-dir-12345');
    expect(info.hasPackageSwift).toBe(false);
    expect(info.hasPackageResolved).toBe(false);
  });

  it('throws when asserting a non-package directory', () => {
    expect(() => assertSwiftPackage('/tmp/nonexistent-dir-12345')).toThrow(
      'No Package.swift found',
    );
  });
});
