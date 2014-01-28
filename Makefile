-include sysdeps/$(shell uname).inc

VERSION=0.1
CXXFLAGS?=-Wall -O3 -ggdb -I. -Iext/libmba -pthread -MMD -MP  $(CXX2011FLAGS) # -Wno-unused-local-typedefs 
CFLAGS=-Wall -I. -Iext/libmba -O3 -MMD -MP
LDFLAGS=$(CXX2011FLAGS)  
CHEAT_ARG := $(shell ./update-git-hash-if-necessary)

PROGRAMS=antonie 16ssearcher digisplice stitcher fqgrep pfqgrep

all: $(PROGRAMS)

-include *.d

.PHONY:	antonie.exe codedocs/html/index.html check

MBA_OBJECTS = ext/libmba/allocator.o ext/libmba/diff.o ext/libmba/msgno.o ext/libmba/suba.o ext/libmba/varray.o 
ANTONIE_OBJECTS = antonie.o refgenome.o hash.o geneannotated.o misc.o fastq.o saminfra.o dnamisc.o githash.o phi-x174.o zstuff.o $(MBA_OBJECTS)

strdiff: strdiff.o $(MBA_OBJECTS)
	$(CC) strdiff.o $(MBA_OBJECTS) -o $@

antonie: $(ANTONIE_OBJECTS)
	$(CXX) $(ANTONIE_OBJECTS) $(LDFLAGS) $(STATICFLAGS) -lz -o $@

SEARCHER_OBJECTS=16ssearcher.o hash.o misc.o fastq.o zstuff.o githash.o fastqindex.o stitchalg.o

16ssearcher: $(SEARCHER_OBJECTS)
	$(CXX) $(LDFLAGS) $(SEARCHER_OBJECTS) -lz -o $@

digisplice: digisplice.o refgenome.o misc.o fastq.o hash.o zstuff.o dnamisc.o geneannotated.o
	$(CXX) $(LDFLAGS) $^ -lz -o $@

stitcher: stitcher.o refgenome.o misc.o fastq.o hash.o zstuff.o dnamisc.o geneannotated.o fastqindex.o stitchalg.o
	$(CXX) $(LDFLAGS) $^ -lz -pthread -o $@

invert: invert.o misc.o
	$(CXX) $(LDFLAGS) $^ -o $@

fqgrep: fqgrep.o misc.o fastq.o dnamisc.o zstuff.o
	$(CXX) $(LDFLAGS) $^ -lz -o $@

pfqgrep: pfqgrep.o misc.o fastq.o dnamisc.o zstuff.o
	$(CXX) $(LDFLAGS) $^ -lz -o $@


install: antonie
	mkdir -p $(DESTDIR)/usr/bin/
	mkdir -p $(DESTDIR)/usr/share/doc/antonie/
	mkdir -p $(DESTDIR)/usr/share/doc/antonie/ext
	cp $(PROGRAMS) $(DESTDIR)/usr/bin/
	cp report.html $(DESTDIR)/usr/share/doc/antonie
	cp -r ext/html $(DESTDIR)/usr/share/doc/antonie/ext

clean:
	rm -f *~ *.o $(MBA_OBJECTS) *.d $(PROGRAMS) githash.h 

package: all
	rm -rf dist
	DESTDIR=dist make install
	fpm -s dir -f -t rpm -n antonie -v g$(shell cat githash) -C dist .
	fpm -s dir -f -t deb -n antonie -v g$(shell cat githash) -C dist .	
	rm -rf dist

codedocs: codedocs/html/index.html

codedocs/html/index.html: 	
	doxygen

antonie.exe: 
	make clean
	STATICFLAGS="-static -static-libgcc -static-libstdc++" CXX=i686-w64-mingw32-g++ CC=i686-w64-mingw32-gcc make antonie
	mv antonie antonie.exe

16ssearcher.exe: 
	make clean
	CXXFLAGS="-Wall -O3 -I. -Iext/libmba -MMD -MP  $(CXX2011FLAGS)" STATICFLAGS="-static -static-libgcc -static-libstdc++" CXX=i686-w64-mingw32-g++ CC=i686-w64-mingw32-gcc make 16ssearcher
	mv 16ssearcher 16ssearcher.exe


check: testrunner
	./testrunner

testrunner: test-misc_hh.o test-dnamisc_cc.o test-saminfra_cc.o testrunner.o misc.o dnamisc.o saminfra.o zstuff.o fastq.o
	$(CXX) $^ -lboost_unit_test_framework -lz -o $@ 
