const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/pages/RoomDetailClient.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Find and replace the old Link map pattern with improved version
const searchPattern = '.map((r: any) => (';
const replaceStart = '{hotel.rooms.filter((r: any) => String(r.id) !== roomId).map((r: any) => (';
const replaceEnd = '))}';

const startIdx = content.indexOf(replaceStart);
if (startIdx === -1) {
  console.log('Pattern not found');
  process.exit(1);
}

let endIdx = content.indexOf(replaceEnd, startIdx);
if (endIdx === -1) {
  console.log('End pattern not found');
  process.exit(1);
}

endIdx += replaceEnd.length;
const oldSection = content.substring(startIdx, endIdx);

const newSection = `{hotel.rooms.filter((r: any) => String(r.id) !== roomId).map((r: any) => {
                  const roomPrice = r.basePrice || 0;
                  const currentPrice = room.basePrice || 0;
                  const priceComparison = roomPrice > currentPrice;
                  const priceDiff = Math.abs(roomPrice - currentPrice);
                  return (
                    <Link
                      key={r.id}
                      href={\`/hotels/\${slug}/rooms/\${r.id}\`}
                      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-[#1B3A6B]/50 transition-all duration-300 flex flex-col hover:-translate-y-1"
                    >
                      {/* Top Image Section */}
                      <div className="relative h-36 md:h-44 bg-slate-100 overflow-hidden">
                        {r.images?.[0] ? (
                          <img src={r.images[0]} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100">
                            <Building2 className="w-10 h-10 text-slate-400" />
                          </div>
                        )}
                        {/* Price Tag */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-white/50">
                          <p className="text-[9px] text-slate-500 font-semibold">FROM</p>
                          <p className="text-xl font-black text-[#1B3A6B] leading-none">₹{(roomPrice).toLocaleString()}</p>
                        </div>
                        {/* Upgrade Badge */}
                        {priceComparison && (
                          <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-3 py-1 rounded-full shadow-md">
                              +₹{priceDiff.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Room Details */}
                      <div className="flex-1 p-4 flex flex-col">
                        <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#1B3A6B] transition-colors leading-tight">
                          {r.name}
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-[8px] font-semibold rounded-md px-2 py-0.5 border-slate-200 text-slate-600 bg-slate-50">
                            <Bed className="w-3 h-3 mr-0.5" /> {r.bedType}
                          </Badge>
                          <Badge variant="outline" className="text-[8px] font-semibold rounded-md px-2 py-0.5 border-slate-200 text-slate-600 bg-slate-50">
                            {r.type}
                          </Badge>
                          {r.sizeSqft && (
                            <Badge variant="outline" className="text-[8px] font-semibold rounded-md px-2 py-0.5 border-slate-200 text-slate-600 bg-slate-50">
                              {r.sizeSqft} sq.ft
                            </Badge>
                          )}
                        </div>
                        {r.viewType && (
                          <p className="text-xs text-slate-600 mb-3 font-medium italic flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {r.viewType}
                          </p>
                        )}
                        <div className="mt-auto pt-3 border-t border-slate-100">
                          <Button className="w-full h-10 bg-[#1B3A6B] text-white font-bold text-sm rounded-lg hover:bg-[#0F1E3D] transition-colors flex items-center justify-center gap-2 group/btn shadow-sm">
                            View & Upgrade
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  );
                })}`;

content = content.replace(oldSection, newSection);
fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Room detail component successfully updated!');
