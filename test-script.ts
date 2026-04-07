import { prisma } from './src/lib/db';
import { signToken } from './src/lib/auth';

async function run() {
  const buyerUser = await prisma.user.findFirst({ where: { role: 'BUYER' } });
  const ownerUser = await prisma.user.findFirst({ where: { role: 'PROJECT_OWNER' } });

  console.log(`[TEST] Creating mock Forward Funding project for ${ownerUser?.name}...`);
  const project = await prisma.project.create({
    data: {
      name: `Test Project ${Date.now()}`,
      description: 'A mock project to test marketplace functionality',
      methodology: 'Solar',
      location: 'India',
      status: 'APPROVED',
      registry: 'CCTS',
      ownerId: ownerUser!.id,
      startDate: new Date(),
      endDate: new Date(),
      estCredits: 100, // Important: 100 capacity
    }
  });

  const buyerToken = await signToken({
    userId: buyerUser!.id,
    email: buyerUser!.email,
    name: buyerUser!.name,
    role: buyerUser!.role as any,
  } as any);

  const ownerToken = await signToken({
    userId: ownerUser!.id,
    email: ownerUser!.email,
    name: ownerUser!.name,
    role: ownerUser!.role as any,
  } as any);

  console.log(`[TEST] Purchasing 60 credits as Buyer over HTTP...`);
  const res1 = await fetch(`http://localhost:3000/api/marketplace/${project.id}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${buyerToken}` },
    body: JSON.stringify({ quantity: 60 })
  });
  const data1 = await res1.json();
  console.log('Buy Res 1:', res1.status, data1);
  const prId = data1.purchaseRequest?.id;

  console.log(`[TEST] Requesting 50 MORE credits as Buyer (should fail due to upfront capacity check)...`);
  const res2 = await fetch(`http://localhost:3000/api/marketplace/${project.id}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${buyerToken}` },
    body: JSON.stringify({ quantity: 50 })
  });
  const data2 = await res2.json();
  console.log('Buy Res 2 (expect failure):', res2.status, data2);

  if (res2.status !== 400 || !data2.error.includes("exceeds available batch supply")) {
    console.error("FAIL: Upfront capacity check did not trigger properly.");
  } else {
    console.log("SUCCESS: Upfront capacity check successfully blocked over-purchasing.");
  }

  console.log(`[TEST] Approving the first request as Project Owner...`);
  const res3 = await fetch(`http://localhost:3000/api/purchase-requests/${prId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${ownerToken}` },
    body: JSON.stringify({ action: 'approve' })
  });
  console.log('Approve Res:', res3.status, await res3.json());

  console.log(`[TEST] Checking if listing status is still ACTIVE... it should be! (40 credits left)`);
  let listing = await prisma.marketListing.findFirst({ where: { batch: { projectId: project.id } }});
  console.log('Listing status:', listing?.status);

  console.log(`[TEST] Requesting the last 40 credits as Buyer...`);
  const res4 = await fetch(`http://localhost:3000/api/marketplace/${project.id}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${buyerToken}` },
    body: JSON.stringify({ quantity: 40 })
  });
  console.log('Buy Res 3:', res4.status, await res4.json());

  const prId2 = (await prisma.purchaseRequest.findFirst({ where: { listingId: listing!.id, status: 'PENDING' }}))?.id;
  
  console.log(`[TEST] Approving the final request...`);
  const res5 = await fetch(`http://localhost:3000/api/purchase-requests/${prId2}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${ownerToken}` },
    body: JSON.stringify({ action: 'approve' })
  });
  console.log('Approve Res 2:', res5.status, await res5.json());

  listing = await prisma.marketListing.findUnique({ where: { id: listing!.id }});
  console.log(`[TEST] Final Listing Status (Expect FULFILLED):`, listing?.status);
  
  if (listing?.status === 'FULFILLED') {
    console.log("SUCCESS: Market listing accurately marked as FULFILLED when capacity depleted!");
  } else {
    console.error("FAIL: Market listing did not resolve to FULFILLED.");
  }
}
run();
