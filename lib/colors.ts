export function getLineColor(line: string): string {
    const colors: Record<string, string> = {
        "1": "EE352E", "2": "EE352E", "3": "EE352E",
        "4": "00933C", "5": "00933C", "6": "00933C", "6X": "00933C",
        "7": "B933AD", "7X": "B933AD",
        "A": "0039A6", "C": "0039A6", "E": "0039A6",
        "B": "FF6319", "D": "FF6319", "F": "FF6319", "FX": "FF6319", "M": "FF6319",
        "G": "6CBE45",
        "J": "996633", "Z": "996633",
        "L": "A7A9AC",
        "N": "FCCC0A", "Q": "FCCC0A", "R": "FCCC0A", "W": "FCCC0A",
        "S": "808183",
        "SIR": "0039A6"
    };
    return colors[line] || "808183";
}

export function getTrainCars(line: string): number {
    // A Division (IRT) runs 10-car trains
    // B Division (BMT/IND) runs 8-car trains, except G (4) and A (10)
    const cars: Record<string, number> = {
        // A Division - 10 cars (except 7 and 7X)
        "1": 10, "2": 10, "3": 10,
        "4": 10, "5": 10, "6": 10, "6X": 10,
        "7": 11, "7X": 11,
        // B Division - 8 cars (except noted)
        "A": 10,
        "B": 8, "C": 8, "D": 10, "E": 10,
        "F": 10, "FX": 10, "M": 8,
        "G": 5,
        "J": 8, "Z": 8,
        "L": 8,
        "N": 10, "Q": 10, "R": 10, "W": 10,
        "S": 6,
        "SIR": 4
    };
    return cars[line] || 8;
}
