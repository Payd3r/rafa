import assert from 'node:assert/strict';
import { test } from 'node:test';
import { masonryLayout, photoRatio } from '../frontend/src/portfolio/masonry.ts';

const photos = [.773,.667,.667,.667,.667,.667,.667,.804,.710,1.4145,1.4145,1.4145,1.4145,.704].map(ratio => ({ratio}));
test('landscapes span two columns, portraits fill around them without overlaps or crops', () => {
  for (const [width,gap,columns] of [[281,10,2],[343,10,2],[932,18,2],[1124,18,3]]) {
    const layout = masonryLayout(photos,width,gap,columns);
    assert.deepEqual([...layout.order].sort((a,b)=>a-b), photos.map((_,i)=>i));
    assert.equal(layout.order[0],0);
    layout.items.forEach((item,i) => {
      assert.equal(item.index,i);
      assert.ok(Math.abs(item.width/item.height-photos[i].ratio)<1e-9);
      assert.ok(item.left>=0 && item.left+item.width<=width+1e-8);
      assert.ok(item.top+item.height<=layout.height+1e-8);
      assert.equal(item.span,photos[i].ratio>1.1?2:1);
      for (const other of layout.items.slice(i+1)) {
        const intersectionX=Math.min(item.left+item.width,other.left+other.width)-Math.max(item.left,other.left);
        const intersectionY=Math.min(item.top+item.height,other.top+other.height)-Math.max(item.top,other.top);
        assert.ok(intersectionX<=.001 || intersectionY<=.001,'photographs overlap');
      }
    });
    const visual=[...layout.items].sort((a,b)=>a.top-b.top||a.left-b.left).map(item=>item.index);
    assert.deepEqual(layout.order,visual);
    assert.ok(layout.items[9].width>layout.items[0].width*2);
    if(columns===3){
      const occupied=layout.items.reduce((area,item)=>area+item.width*item.height,0)/(width*layout.height);
      assert.ok(occupied>.92,`Poor packing: ${occupied}`);
      for(const wide of layout.items.filter(item=>item.span===2)){
        assert.ok(layout.items.some(other=>other.span===1 && Math.min(wide.top+wide.height,other.top+other.height)-Math.max(wide.top,other.top)>wide.height*.7),'landscape has no portrait alongside');
      }
    }
  }
});
test('packing is deterministic and handles portrait-only, landscape-only, missing metadata and empty galleries', () => {
  for(const input of [photos, Array.from({length:30},()=>({ratio:.667})),Array.from({length:30},()=>({ratio:1.5})),[{}, {ratio:2.8}, {width:400,height:600}]]){
    const first=masonryLayout(input,1124,18,3);
    assert.deepEqual(masonryLayout(input,1124,18,3),first);
    assert.equal(first.items.length,input.length);
    assert.ok(Number.isFinite(first.height));
  }
  assert.deepEqual(masonryLayout([],300,10),{items:[],order:[],height:0});
  assert.equal(photoRatio({width:1200,height:800}),1.5);
  assert.equal(photoRatio({ratio:Infinity}),.8);
  assert.equal(photoRatio({ratio:-1}),.8);
});
