
function makeSNPStat()
{
    var ret={};
    ret.counts=0;
    ret.present=[];
    return ret;
}

function UpdateTable()
{
    var numpools=0, numMuts=0, filteredSNPs=0, nonGene=0;
    var snps={};
    var numDiffLimit = document.getElementById("numDiff").value;
    var percDiffLimit = document.getElementById("percDiff").value;
    var geneFilter = document.getElementById("geneFilter").checked;
    var nonsynFilter = document.getElementById("nonsynFilter").checked;
    var nonuniversalFilter = document.getElementById("nonuniversalFilter").checked;
    var deletesOnly = document.getElementById("deletesOnly").checked;
    var insertsOnly = document.getElementById("insertsOnly").checked;
    // console.log("The gene filter "+geneFilter);

    $.each(loci, function(pool, poollocus) {
	numpools++;
	numMuts+= poollocus.length;
	$.each(poollocus, function(pos, locus) { 
	    if(geneFilter && !locus.gene) {
		nonGene++;
		return;
	    }
	    if(snps[locus.locus] == undefined) {
		snps[locus.locus]=makeSNPStat();
		try {
    		    snps[locus.locus].description = decodeURIComponent(locus.annotation);
                }
                catch(e) {
    		    snps[locus.locus].description = locus.annotation;
                    console.log(locus.annotation);
                }
	    }
	    
	    snps[locus.locus].count++;
	    snps[locus.locus].present.push([pool, locus]);
	});
    });

    var distinct=0;
    $.each(snps, function() {
 	distinct++;
    });

    
    var table="<table><tr><th>Locus</th><th>Description</th>";
    for(pool in loci) {
	table+=("<th>"+pool+"</th>");
    }
    var realCount=0;
    $.each(snps, function(locus, snp) {
	row="<tr><td>"+locus+"</td><td><small>"+snp.description+"</small></td>";
	var real=false;
	var totfound=false;
	var universal=snp.present.length > 0;
	var totCount=0;	
	for(pool in loci) {
	    var found=false;

	    for(pos in snp.present) {
		if(snp.present[pos][0]==pool) {
		    var aminoReport = snp.present[pos][1].aminoReport;				
		    
		    var mouseOver="onmouseover='nhpup.popup(\"";
		    mouseOver+=snp.present[pos][1].summary+" ";
		    mouseOver+= "Numdiff: "+snp.present[pos][1].numDiff;
		    mouseOver+= ", ";
		    if(snp.present[pos][1].xCount) 
			mouseOver += snp.present[pos][1].xCount+" deletes, ";
		    if(snp.present[pos][1].insertReport != "") {
			mouseOver += "Inserts: "+snp.present[pos][1].insertReport+", ";
		    }
		    var totPresent=snp.present[pos][1].numDiff + snp.present[pos][1].depth;
		    mouseOver+=(100.0*snp.present[pos][1].numDiff/totPresent).toFixed(2);
		    mouseOver+= "&percnt;, depth: " + totPresent;
		    mouseOver +=", "+aminoReport;
		    mouseOver+="\");'";
		    
		    var onClick='onclick="';
		    onClick+="drawGraph('" +pool+"',"+ locus + ");";
		    onClick+='"';

		    if(nonsynFilter) {
			var re=/([A-Z][a-z ]+) -> ([A-Z][a-z ]+) $/;
			var result = re.exec(aminoReport);
			//				console.log(aminoReport +": "+result);
			if(result != null && result[1]==result[2]) {
			    //						console.log("Neutral:'"+result[1]+"' '"+result[2]+"'");
			    continue;
			}
		    }
		    if(deletesOnly && snp.present[pos][1].xCount == 0) 
			continue;
		    if(insertsOnly && snp.present[pos][1].insertReport=='')
			continue;
		    totCount+=snp.present[pos][1].numDiff;	
		    var percentage = 100.0* snp.present[pos][1].numDiff / snp.present[pos][1].depth;
		    if(snp.present[pos][1].numDiff < numDiffLimit || percentage < percDiffLimit) 
			row+='<td '+mouseOver+' '+onClick+'><font	color="#bbbbbb">'+pool+'</font></td>';
		    else if(snp.present[pos][1].numDiff > 10 && percentage >= percDiffLimit) {
			row+='<td '+mouseOver+' '+onClick+'><b>'+pool+'</b></td>';	
			real=1;
		    }				
		    else {
			row+="<td "+mouseOver+' '+onClick+">"+pool+"</td>";
			real=1;
		    }	
		    found=true;
		    break;
		}
	    }
	    if(!found) {
		row+="<td></td>";
		universal=false;
	    }
	}
	
	row+="</tr>";
	if((real || (totCount > 3*numDiffLimit && totCount > 20)) && (!nonuniversalFilter || !universal)) {
	    table+=row;
	    realCount++;
	}
    });

    table+=("</table>");
    d3.select("#toctable").html(table);
    
    var resp = "There are "+numpools+ " pools, "+numMuts+" candidate mutations, "
    resp += nonGene + " non-genes, "+realCount+" distinct left";
    d3.select("#log").text(resp);
    
    return false;
}

function drawGraph(pool, locus)
{
    $("#dialog").dialog("open");
    
    var item={};
    $.each(loci[pool], function(key, val) {
	if(val.locus==locus) 
	    item=val;
    });
    console.log(item);
    d3.select("#dialog").html('');
    nv.addGraph((function() {	
	var chart = nv.models.lineChart()
	    .options({
		margin: {left: 100, bottom: 75},
		x: function(d,i) { return d.x},
		showXAxis: true,
		showYAxis: true,
		transitionDuration: 250
	    })
	    .forceY([0]);

	chart.xAxis.axisLabel("Position (p)").tickFormat(d3.format(',d'));
	chart.yAxis.axisLabel('Depth').tickFormat(d3.format(',d'));

	var ourdiv=d3.select('#dialog').append('div').attr('class','chart').attr('id',"region"+item);
	ourdiv.append('p').html("Pool "+pool+", locus "+locus+", depth "+item.depth+", differences: "+item.numDiff+", fraction forward: "+item.fraction);
	ourdiv.append('p').html(item.annotation);
	ourdiv.append('p').html("Change summary: "+item.summary);
	ourdiv.append('p').html("Amino acid change: "+item.aminoReport+", inserts: "+item.insertReport+", deletes: " + item.xCount);
	ourdiv.append('svg').datum(getPoints5(item.graph, "Depth", item.aProb, "aProb", item.cProb, "cProb", item.gProb, "gProb", item.tProb, "tProb", item.xProb, "xProb")).call(chart);
	nv.utils.windowResize(chart.update);
	
	return chart;
    })());
}
UpdateTable();
