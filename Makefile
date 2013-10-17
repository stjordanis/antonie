CXXFLAGS=-Wall -I. -Iext/libmba  -MMD -O3 -std=gnu++0x
CFLAGS=-I. -Iext/libmba -O3 -MMD

all: powerdna 16ssearcher

-include *.d

POWERDNA_OBJECTS = powerdna.o hash.o geneannotated.o misc.o fastq.o ext/libmba/libdiff.a

strdiff: strdiff.o ext/libmba/libdiff.a
	gcc strdiff.o ext/libmba/libdiff.a

powerdna: $(POWERDNA_OBJECTS)
	g++ $(LDFLAGS) $(POWERDNA_OBJECTS) -o $@

16ssearcher: 16ssearcher.o hash.o misc.o fastq.o
	g++ $(LDFLAGS) 16ssearcher.o hash.o misc.o fastq.o -lz -o $@

clean:
	rm -f *~ *.o *.d powerdna

report.html: report-header.html data report-footer.html
	cat report-header.html data report-footer.html > $@	