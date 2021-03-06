#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <forward_list>
#include <map>
#include "geneannotated.hh"
#include "antonie.hh"
#include "fastq.hh"

using std::string;
using std::vector;
using std::unordered_map;
using std::map;
using std::forward_list; 
using std::unique_ptr;

//! Position of a FastQRead that is mapped here, and how (reverse complemented or with an indel, and where)
struct FASTQMapping
{
  uint64_t pos;
  bool reverse;
  int indel; // 0 = nothing, >0 means WE have an insert versus reference at pos
             // <0 means WE have a delete versus reference at pos
};

//! List of all FASTQMapping s that map to a locus, plus coverage statistic
struct GenomeLocusMapping
{
  GenomeLocusMapping() : coverage(0) {}
  forward_list<FASTQMapping> d_fastqs;
  unsigned int coverage;
};


//! A region with little coverage
struct Unmatched
{
  string left, unmatched, right;
  dnapos_t pos;
};

//! Represents a reference genome to be aligned against
class ReferenceChromosome
{
public:
  ReferenceChromosome(const string& fname); //!< Read reference from FASTA

  static unique_ptr<ReferenceChromosome> makeFromString(const string& str);
  dnapos_t size() const {
    return d_genome.size() - 1; // we pad at the beginning so we are 1 based..
  }
  vector<uint32_t> getMatchingHashes(const vector<uint32_t>& hashes);

  //! Describes how a FastQRead (not mentioned) matches to the reference (straight or in reverse), and what the matching score is
  struct MatchDescriptor
  {
    ReferenceChromosome* rg;
    dnapos_t pos;
    bool reverse;
    int score;
  };
  void mapFastQ(dnapos_t pos, const FastQRead& fqfrag, int indel=0);
  void cover(dnapos_t pos, char quality, int limit);
  void cover(dnapos_t pos, unsigned int length, const std::string& quality, int limit) ;
  vector<MatchDescriptor> getAllReadPosBoth(FastQRead* fq); // tries original & complement
  dnapos_t getReadPosBoth(FastQRead* fq, int qlimit); // tries original & complement
  vector<dnapos_t> getReadPositions(const std::string& nucleotides);

  vector<dnapos_t> getGCHisto();
  string snippet(dnapos_t start, dnapos_t stop) const;

  void printCoverage(FILE* jsfp, const std::string& fname);
  void index(unsigned int length);

  string getMatchingFastQs(dnapos_t pos, StereoFASTQReader& fastq); 
  string getMatchingFastQs(dnapos_t start, dnapos_t stop,  StereoFASTQReader& fastq); 
  vector<GenomeLocusMapping> d_mapping;
  vector<unsigned int> d_correctMappings, d_wrongMappings, d_gcMappings, d_taMappings;

  vector<Unmatched> d_unmRegions;
  //! statistics for a locus
  struct LociStats
  {
    //! A difference in this locus
    struct Difference
    {
      char nucleotide;
      char quality;
      bool headOrTail;
      string insert;
      bool operator<(const Difference& b) const
      {
	return std::tie(nucleotide, quality) < std::tie(b.nucleotide, b.quality);
      }
    };
    vector<Difference> samples; 
  };
  dnapos_t d_aCount, d_cCount, d_gCount, d_tCount;
  typedef unordered_map<dnapos_t, LociStats> locimap_t;
  locimap_t d_locimap;
  unordered_map<dnapos_t, unsigned int> d_insertCounts;
  string d_name;
  string d_fullname;
  unique_ptr<GeneAnnotationReader> d_gar;
  void addAnnotations(GeneAnnotationReader* gar) 
  {
    d_gar=unique_ptr<GeneAnnotationReader>(gar);
  }
private:
  ReferenceChromosome() = default;
  void initGenome();
  string d_genome;
  struct HashPos {
    HashPos(uint32_t hash_, dnapos_t pos) : d_hash(hash_), d_pos(pos)
    {}
    HashPos(){}
    uint32_t d_hash;
    dnapos_t d_pos;
    
    bool operator<(const HashPos& rhs) const 
    {
      return d_hash < rhs.d_hash;
    }
  };

  typedef vector<HashPos> index_t;
  map<int, index_t> d_indexes;
};
