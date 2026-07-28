import { describe, it, expect } from 'bun:test';
import { groupAnagrams } from './LC49-group-anagrams';

/** 排序后比较，因为分组顺序不固定 */
function sortedGroups(groups: string[][]): string[][] {
  return groups.map((g) => [...g].sort()).sort();
}

describe('LC49 Group Anagrams', () => {
  it('normal case', () => {
    const result = groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);
    expect(sortedGroups(result)).toEqual(
      sortedGroups([['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']])
    );
  });

  it('single empty string', () => {
    expect(groupAnagrams([''])).toEqual([['']]);
  });

  it('single char', () => {
    expect(groupAnagrams(['a'])).toEqual([['a']]);
  });

  it('all anagrams', () => {
    const result = groupAnagrams(['ab', 'ba', 'ab']);
    expect(sortedGroups(result)).toEqual([['ab', 'ab', 'ba']]);
  });

  it('no anagrams', () => {
    const result = groupAnagrams(['abc', 'def', 'ghi']);
    expect(sortedGroups(result)).toEqual([['abc'], ['def'], ['ghi']]);
  });
});
