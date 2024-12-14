import pstats
import sys

def main(profile_file):
    p = pstats.Stats(profile_file)
    p.sort_stats('cumulative')
    for func, (cc, nc, tt, ct, callers) in p.stats.items():
        file_name, line, func_name = func
        print(f"{ct} {func_name} {file_name} {line}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: parse_profile.py <profile_file>")
        sys.exit(1)
    main(sys.argv[1])