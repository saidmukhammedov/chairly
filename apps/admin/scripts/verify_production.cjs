/**
 * Comprehensive Production Readiness & Feature Verification Script
 * Validates real live API behavior against https://chairly.uz
 */

const BASE_URL = process.env.TEST_BASE_URL || 'https://chairly.uz';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('===============================================================');
  console.log(`🚀 RUNNING LIVE PRODUCTION VERIFICATION ON: ${BASE_URL}`);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} - ${detail}`);
      failed++;
    }
  }

  // 1. Health check
  console.log('--- 1. API Health Check ---');
  const health = await request('/api/health');
  assert(health.status === 200 && health.data?.status === 'ok', 'API is live and responding with status: ok');

  // 2. Customer Registration via 3 fields (fullName, phone, password)
  console.log('\n--- 2. Customer Registration via Phone ---');
  const testPhone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testCustomer = {
    fullName: 'Olimjon Karimov',
    phone: testPhone,
    password: 'Password123!',
  };

  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testCustomer),
  });

  assert(regRes.status === 201, 'Customer registered successfully', JSON.stringify(regRes.data));
  assert(regRes.data?.user?.role === 'CUSTOMER', 'Registered user has CUSTOMER role');
  assert(regRes.data?.user?.firstName === 'Olimjon' && regRes.data?.user?.lastName === 'Karimov', 'Full name correctly split into firstName and lastName');
  assert(Boolean(regRes.data?.tokens?.accessToken), 'JWT access token returned upon registration');

  // 3. Phone Uniqueness Constraint
  console.log('\n--- 3. Phone Uniqueness Constraint ---');
  const dupRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Boshqa Odam',
      phone: testPhone,
      password: 'AnotherPassword123!',
    }),
  });
  assert(dupRes.status === 400, 'Duplicate phone number registration rejected with 400');
  const dupErr = dupRes.data?.error || dupRes.data?.message || '';
  assert(
    dupErr.includes('allaqachon mavjud') || dupErr.includes('already exists'),
    'Duplicate phone returns clear localized rejection message',
    dupErr
  );

  // 4. Customer Login via Phone Number
  console.log('\n--- 4. Customer Login via Phone Number ---');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: testPhone,
      password: 'Password123!',
    }),
  });
  assert(loginRes.status === 200, 'Customer logged in successfully with phone and password');
  assert(loginRes.data?.user?.phone === testPhone, 'Returned customer phone matches registration');
  const customerToken = loginRes.data?.tokens?.accessToken;

  // 5. Invalid Password & Security Checks
  console.log('\n--- 5. Security & Non-Revealing Error Messages ---');
  const badLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: testPhone,
      password: 'WrongPassword!',
    }),
  });
  assert(badLogin.status === 401, 'Bad credentials returns 401');
  const badErr = badLogin.data?.error || badLogin.data?.message || '';
  assert(
    badErr.toLowerCase().includes('noto') || badErr.toLowerCase().includes('invalid'),
    'Returns non-revealing error message (no user enumeration)',
    badErr
  );

  // 6. Platform Owner Authentication
  console.log('\n--- 6. Platform Owner Authentication ---');
  const ownerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: 'admin@chairly.app',
      password: 'chairly123',
    }),
  });
  assert(ownerLogin.status === 200, 'Platform owner logged in successfully');
  assert(ownerLogin.data?.user?.role === 'OWNER', 'Owner has platform OWNER role');
  assert(ownerLogin.data?.user?.email === 'admin@chairly.app', 'Owner email is admin@chairly.app');
  const ownerToken = ownerLogin.data?.tokens?.accessToken;

  // 7. Public Barbershop Application Submission (/api/applications)
  console.log('\n--- 7. Barbershop Business Application Submission ---');
  const appPhone = `+99891${Math.floor(1000000 + Math.random() * 9000000)}`;
  const appSlug = `test-barber-${Date.now().toString().slice(-6)}`;
  const appPayload = {
    shopName: `Test Premium Cuts ${appSlug}`,
    city: 'Tashkent',
    address: 'Mirzo Ulugbek tumani, Mustaqillik shoh ko‘chasi, 45-uy',
    shopPhone: appPhone,
    applicantName: 'Jasur Rahimov',
    applicantPhone: appPhone,
    description: '3 ta mohir usta ishlaydi. 6 yillik tajribamiz bor.',
  };

  const submitApp = await request('/api/applications', {
    method: 'POST',
    body: JSON.stringify(appPayload),
  });
  assert(submitApp.status === 201, 'Public application submitted successfully', JSON.stringify(submitApp.data));
  const appData = submitApp.data?.application || submitApp.data;
  assert(appData?.status === 'PENDING', 'New application status is PENDING');
  const applicationId = appData?.id;

  // 8. Public Status Tracking by Phone
  console.log('\n--- 8. Public Status Tracking by Phone ---');
  const statusRes = await request(`/api/applications/status?phone=${encodeURIComponent(appPhone)}`);
  assert(statusRes.status === 200, 'Public status check returns 200');
  const statusList = Array.isArray(statusRes.data) ? statusRes.data : statusRes.data?.applications || [];
  const foundByPhone = statusList.find((a) => a.id === applicationId || a.shopName === appPayload.shopName);
  assert(Boolean(foundByPhone), 'Application found in status endpoint by applicant phone');
  assert(foundByPhone?.status === 'PENDING', 'Tracked status is PENDING');

  // 9. Role-Based Access Control (RBAC)
  console.log('\n--- 9. Role-Based Access Control (RBAC) ---');
  const custForbidden = await request('/api/applications', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert(custForbidden.status === 403, 'Regular customer is forbidden (403) from listing business applications');

  // 10. Platform Owner Review Applications
  console.log('\n--- 10. Platform Owner Review Applications ---');
  const listApps = await request('/api/applications', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(listApps.status === 200, 'Owner can retrieve business applications');
  const ownerApps = listApps.data?.applications || [];
  const foundApp = ownerApps.find((a) => a.id === applicationId);
  assert(Boolean(foundApp), 'Submitted application visible in owner dashboard');

  // 11. Platform Owner Inspecting Application Details
  console.log('\n--- 11. Application Detail Inspection ---');
  const detailApp = await request(`/api/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(detailApp.status === 200, 'Owner can inspect application details');
  assert(detailApp.data?.shopName === appPayload.shopName, 'Inspected shop name matches submission');

  // 12. Platform Owner Approves Application (Transactional Provisioning)
  console.log('\n--- 12. Transactional Approval & Business Provisioning ---');
  const approveRes = await request(`/api/applications/${applicationId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ reviewNotes: 'Hujjatlar tekshirildi va tasdiqlandi.' }),
  });
  assert(approveRes.status === 200, 'Application approved successfully', JSON.stringify(approveRes.data));
  assert(approveRes.data?.application?.status === 'APPROVED', 'Application status updated to APPROVED');
  assert(Boolean(approveRes.data?.shop?.id), 'New Shop entity created in database');
  const managerPassword = approveRes.data?.adminUser?.temporaryPassword;
  assert(Boolean(managerPassword), 'Temporary manager credentials generated securely');

  // 13. Approval Idempotency
  console.log('\n--- 13. Approval Idempotency Test ---');
  const reApprove = await request(`/api/applications/${applicationId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ reviewNotes: 'Again' }),
  });
  assert(reApprove.status === 400, 'Re-approval rejected with 400 (Cannot double-approve)');

  // 14. Approved Shop Manager Authentication
  console.log('\n--- 14. Approved Shop Manager Authentication ---');
  const managerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: appPhone,
      password: managerPassword,
    }),
  });
  assert(managerLogin.status === 200, 'Newly approved shop manager logged in with issued credentials', JSON.stringify(managerLogin.data));
  assert(managerLogin.data?.memberships?.length === 1, 'Manager has exactly 1 assigned barbershop');
  const managerShopId = managerLogin.data?.memberships?.[0]?.shopId;
  assert(managerShopId === approveRes.data?.shop?.id, 'Assigned shopId matches newly created shop');
  const managerToken = managerLogin.data?.tokens?.accessToken;

  // 15. Shop Admin Isolation & Permissions
  console.log('\n--- 15. Shop Admin Tenant Isolation ---');
  // Manager cannot access owner applications
  const mgrApplicationsForbidden = await request('/api/applications', {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert(mgrApplicationsForbidden.status === 403, 'Shop manager is forbidden (403) from global platform applications');

  // Manager can read their own shop details
  const myShop = await request(`/api/shops/${managerShopId}`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert(myShop.status === 200, 'Manager can view their assigned barbershop');
  assert(myShop.data?.workingHours?.length === 7, 'Shop automatically provisioned with all 7 days working hours');

  // 16. In-App Notifications
  console.log('\n--- 16. In-App Notifications ---');
  const notifs = await request('/api/notifications', {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  assert(notifs.status === 200, 'Manager can fetch in-app notifications');
  const notifList = notifs.data?.notifications || [];
  assert(notifList.length >= 1, 'Manager received notification in in-app inbox');
  assert(
    notifList.some((n) => n.title.includes("ma'qullandi") || n.title.includes("ma’qullandi") || n.title.includes('approved')),
    'Approval notification received with congratulatory message'
  );

  // Summary
  console.log('\n===============================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
