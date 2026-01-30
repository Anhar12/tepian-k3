# Changelog

All notable changes to this project will be documented in this file.

## [unreleased]

### 🚀 Features

- Add order and testing sequence names and implement number generation functions ([0b884bf](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/0b884bf7d63592e93066f4272f93dda1de6c9475))
- Refactor order and testing number generation, add order and order item tables ([e5d9747](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/e5d9747633f1537ed70d322a93adc3e65913e89e))
- Add order and testing relations, including order status history ([dd19162](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/dd19162873a34243e0c5d873c243f440e979849d))
- Update order relations and schema to include location reference and default timestamp ([851c0f7](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/851c0f7f988614947a90abe21b9f04cb5516b4b2))
- Add types for order, order item, order status history, and testing with relations ([98f7bfb](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/98f7bfbed36a43136b6f038291fc68a450461a8a))
- Refactor testing and order schemas, relations, and types ([000b63f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/000b63f06bc576efc8e04f2c8fd666c3b83140c4))
- **db:** Add new migration for empty king bedlam and update testing status enum ([6ee66e0](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/6ee66e08f6955ad2b16c2f58090ef9adb8cb0cf8))
- Update profile picture column name to camelCase in users table ([524e5a3](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/524e5a3be6972db232e63147d428b9fca2e9a432))
- Add Katalog route and update related components for navigation ([d27623c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d27623c85bbae8a3ed2372d0851a3f7e7f576dbf))
- **transaksi:** Add new routes for steps 2, 3, and 4; refactor existing routes and components ([91d7195](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/91d7195ecf8f4d7ccb202e7cdf215a417adbbf7a))
- Add order and order status history queries, update schemas and permissions ([27ad004](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/27ad0047dd403763207994368bac43fcbfb489e4))
- **cart:** Implement Zustand store for managing cart items and their quantities ([f7ad5b7](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/f7ad5b74c51a871c76bbd69a45d05c2719db0973))
- **cart:** Refactor getUserCartList to group items by location ([69df007](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/69df00716a8fd9c85fd19edb2df11a25a0b6b40a))
- **cart:** Implement CartSheet component and related state management ([c341e21](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c341e2165f32e3fa72f6186ce8cd247fefa3665b))
- **routes:** Add UnderConstruction component for new routes and update navigation links ([3a2ab2f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/3a2ab2fdd1f7575191cc5e06ec74dd847f4f0c46))
- **docs:** Enhance README with features, tech stack, and setup instructions ([e110ef4](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/e110ef47d27ec0382eface06604bf5ed21bb9402))
- **docs:** Add initial project documentation including overview, tech stack, and key commands ([72cb358](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/72cb3586dc8febe3bbcb5ff5954d67a90e84a542))
- **checkout:** Add checkout route and implement checkout component with cart item management ([1a2dcde](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/1a2dcde510754919cd506ec782f55deff6492fdb))
- **cart:** Change overflow behavior in CartSheet and Checkout components for improved scrolling experience ([4c40910](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4c409101522d8d18444d4a9a927bb178e27e0fdd))
- **storage:** Implement date-based path generation for file uploads in FileSystemProvider and MinioProvider ([69b3fa7](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/69b3fa75c2e080446c3d7393ea64297ced6062d7))
- **upload:** Refactor upload route to handle dynamic paths and enhance security checks ([a7fed73](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/a7fed7391eb19f5ec3c7e734df996dd9d18fdaeb))
- Feat(profile): enhance profile picture upload with improved UI and file handling
feat(queries): refactor user and company queries to extract keys from URLs for better error handling
feat(storage): add methods to extract folder paths and keys from public URLs in storage providers ([e7f00e5](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/e7f00e5c04d2c9577428ff41d8f745b03b078961))
- **upload:** Refactor file handling to use URL instead of filename for user and company uploads ([78a9973](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/78a9973cd1f8318eb039cc28a2c08623c6a40b55))
- **profile:** Localize avatar upload success and error messages ([32262a4](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/32262a41d23d9e49c7cf6a724fec6786d1367c57))
- **checkout:** Update total price calculation to handle cart items correctly ([fbea8ee](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/fbea8eebb90c516c7c04b4bf36adc6574d20e48b))
- Implement SSEManager for server-sent events handling ([913b57e](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/913b57e62da8797b96cd4f1289d2e5d2af3e5bcd))
- **logger:** Enhance logging functions with structured context support ([b13a40f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/b13a40fda9ca77862b178573365a2722d65e77e1))
- **env:** Add Redis configuration to .env.example ([c2ea533](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c2ea5334e733afe5daf48fb49af33a5faf22bb25))
- **event:** Implement event broadcasting and subscription for test events ([24ce6c2](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/24ce6c2ce504e9fcb99606a180be9808dc6039d0))
- Enhance project documentation and structure for tepian-k3 ([bb74838](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/bb748389ae9d20fe46894165669efc503b84b945))
- **audit:** Implement comprehensive audit logging system ([40e90d3](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/40e90d3434c5d177c69eb0ecc0a01f49123c4c9a))
- **survey:** Add survey form component and routing for customer satisfaction survey ([76bd0df](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/76bd0dff93317492bebe858ffcf0a715a80dbd0a))
- **order:** Implement order timeline component and status route ([002ae59](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/002ae591bd97603a124058d4e598952576e8392b))
- **order:** Add order-related components and routes, including order card, skeletons, and transaction handling ([3f15707](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/3f157071827c32fc4b83c306e76be5df19dd4224))
- **order:** Enhance OrderCard component with badge color utility and update PengujianNavbar for order navigation ([d7e0d6c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d7e0d6cca778f92be24b77c5cc574588cbbb86bc))
- **order:** Implement invoice generation functionality and update order-related types and queries ([f10c1fa](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/f10c1fa675d180ea7cd45ddfc185cb58d94c0cb1))
- **order:** Add functionality for generating offering letters and enhance invoice generation with company details and asset handling ([56c7e39](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/56c7e394c09df4d2dc3d7eca51b2d5bf62168e2c))
- **order:** Add functionality to generate offering letters and integrate button for downloading existing documents ([c87f0b1](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c87f0b1fa06f2fccf442515015ff93882ff3a34c))
- **document-signing:** Add document signing service with JWT support ([ea56895](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ea56895c3ba4cb25fbb5dc96b4fab69f51bc2ed7))
- **migrations:** Add new migration entry for absent_colonel_america ([cdd8342](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/cdd8342c32783fb96da6a59c877902c708b75353))
- **pdf:** Add QR code generation and integration into PDF templates ([07afacc](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/07afaccf803aa387f79801b1d7951ace44584d28))
- Add document signatures feature with QR code integration ([39092cf](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/39092cf1776bcfaea025c0c6a4ee763dc9ff6d1b))
- Replace useSuspenseQuery with useQuery for client-side optimization ([469e3b3](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/469e3b30c57d64752ad6c79d6cd0f2c4dd065506))
- Update queries to useQuery for improved client-side performance ([18344cf](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/18344cf4a9104c1b38d938822e2fb574573520a8))
- Add EmptyState and SkeletonGenerator components for improved UI handling ([f50c87f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/f50c87fbb6bdfb5be70c57782b95142a04efcb21))
- Add ButtonWithLoading component for enhanced user experience during loading states ([fa8fc56](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/fa8fc56a7a04e3d6c0a5135f9f574f5f0785ef62))
- Implement image service for WebP conversion and update user company and user routers to utilize it ([d1d015e](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d1d015e6d1fe01c4e3b2e68a4ee6c4c5c4a9b1e9))
- Add Tepian K3 logo to AppSidebar and update back office menu items ([80d9cc4](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/80d9cc423526b2a5403fe0fe5b85a10bbd15f932))
- Enhance DataTableActionCell with navigation and update CRUD action paths ([496ad59](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/496ad596800af1a8095c86398342dbf051659ca0))
- Add loading skeletons for role detail page ([c549e13](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c549e13cbf9ca1e30801b2fdf5c0dec77dcbc536))
- Add SkeletonTextArea component and integrate skeleton loaders in parameter categories and roles edit pages ([c683dbf](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c683dbf044d2338d5b4664ae51c30ce66795dee3))
- Create loader component for all pending routes ([acad3b7](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/acad3b753ad86c939380ea98f28d27939a4b5ec1))
- Add loading skeletons to parameter edit and tools components ([d5849e3](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d5849e3f51c08c704f814c0172906ad8a1193b0a))
- Add employee table and role to the database schema ([8701252](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/87012525a14dbabf66b496409e1179d299725b06))
- Add worksheets and related tables to schema ([59ec7e0](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/59ec7e003e4cd5e126d3874ca2955a06713b2fb3))
- Add employee seeding functionality and faker dependency ([6c95994](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/6c95994340cf7b7ce12356dba68fb2832ad715bf))
- Add employee management functionality ([1bb6b48](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/1bb6b4827cd8a76a5dc2009a5b8b11076e01d61f))
- Streamline permission and role management in database seeding ([c1861db](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c1861dbc8f968b53b4f76d4ffd27326f3a30b738))
- Fix user role assignment and improve error logging in createUser function ([785b70b](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/785b70b6e3bf79fc989c915ac46256e084b7949a))
- Enhance permission management and fix typos in user roles queries ([591d92f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/591d92f727a39ea6f78002d704ed127b96153810))
- Update permission scopes from 'read' to 'view' across multiple routers ([3580780](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/358078047eadffe4bc72aec81d27ae1bf2cd2cfc))
- Remove permission checks from company routes for streamlined access ([ac81f65](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ac81f65f9dcf1f25ed25cc1646ab785498309329))
- Add skeleton loading states for company detail and testing location components ([9407e2f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/9407e2f6b6787f08e8a701ac70ada4d2d004b2be))
- Update SkeletonButton to be full width in LoaderComponent ([b30888d](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/b30888d701af1534da164d686e88b8f8d876cad0))
- Update tool selection labels in create and edit routes ([50efceb](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/50efceb68d8125001be14c53ba7c8386481d039d))
- Add refresh token functionality with schema, queries, and migration ([5fcb48d](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/5fcb48d5ef29354c1bbfe1fc8fed83668dba5ac7))
- Implement refresh token system with session management and token utilities ([a019938](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/a019938487d7d5aad14f268cf50ff506099dcf26))
- Add settings option to user navigation menu and refactor session manager for improved readability ([2af25da](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/2af25daef214eb13f33558c8fcc19c5df054ab43))
- Implement profile manager component and enhance settings route with tab navigation ([9286b03](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/9286b032ecb48393fc86149fb8b4b952ca700ff1))
- Update logout functionality to remove access and refresh tokens from local storage ([bfa5c24](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/bfa5c244c095cf1e13ec756abea7bdf34d559d51))
- Replace Empty component with EmptyState for improved consistency and readability across various components ([368c7ec](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/368c7ec6eadcd9016d925a405597b0bc1858fe46))
- Remove unused storage client export from package.json ([6ba64d4](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/6ba64d4fcfbe0b387fb446104262c12c1eb3ed84))
- **rate-limiter:** Implement Redis and in-memory rate limiting service ([8b03abb](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/8b03abb83d930f01ac5ef7df99a81a0563d82187))
- Implement rate limiting across various routers for enhanced API performance ([4f4521d](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4f4521d636f1b8e47232335d54ecd02ce64507e1))
- Add color mappings for tool conditions and availability statuses ([4def7c1](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4def7c17eba552c7c0ef0814eb4c5949c1160b58))
- Add katalog route mask for improved routing management ([7a93e50](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7a93e50bd2fe46b27b2e5fb5ac67031106e2fb6d))
- Add notifications feature with CRUD operations and schema definitions ([a4998e9](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/a4998e987dc6b2f11c7394acc679032c33977963))
- Add rate limiting to notifications router and update resources list ([e3dc95c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/e3dc95c73f38a9e40b78fc1f8822863a57dd620b))
- Enhance error handling in ErrorComponent with Zod validation and prettified messages ([4c4e784](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4c4e78468646ea07c4768795ff9239b803e72448))
- Add OS and version fields to refresh tokens ([ce47ff5](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ce47ff5b94d64b80eb0a408f68541c82cc62c216))
- Implement refresh token support in OTP service with updated token generation and API response ([d778c21](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d778c21184b978615a59e570868d3f80ff2d591f))
- Update permission types to use defined Permission type and change read permissions to view ([7515b48](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7515b48e948a239b20a8b68deb0d424547999645))
- Implement worksheet header and sidebar components with routing and data generation ([95a283d](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/95a283dbed1e32c356820d04a6d721ec032c8605))
- Update company name in WorksheetSidebar and add padding to settings container ([d51a22a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d51a22a06dfe0d6731cc644d0211556493eceea2))
- Remove unused imports from WorksheetSidebar component ([7456ad3](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7456ad39c5fbe4bcdcb19fde7d88a905b5a31b84))
- Add jadwal-personil worksheet route and update constants for employee status colors ([35ebbfa](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/35ebbfa9d5a0e422bc94522bb32d5d3d8117a3c6))
- Add best practices for SVG optimization, state management, and server-side performance ([279ecbd](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/279ecbd5e2ed49fb3021ce9cd384a111ebcb41aa))
- Add testing and worksheet queries with CRUD operations ([ae36e4b](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ae36e4b247bd6e1a6be6b98843139ff4219fb811))
- Update permissionPrefix type to Resource in CrudActionCellConfig ([cef2b5a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/cef2b5a383fd619cfba6c500b8852c3ae5900245))
- Implement order status notifications and update approval/rejection reasons ([6e97ed5](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/6e97ed571ec12992e31f0032f951af2de3fa5b95))
- Add new order management features and update schemas ([d9939af](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d9939afc136d01945898a869f900b8e6cffa00f9))
- Implement personnel scheduling and assignment functionality ([06ac591](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/06ac59107c05c3892a0cafeb4b5beb64718d466b))
- Add testing management and detail views ([73af3dc](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/73af3dca0af87554974ddaf887f79d01c9b4cc7e))
- Implement worksheet notes functionality with subscription and queries ([db5f826](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/db5f8261130a53bbbb8f12fb485226e5dc9ddc3d))
- Enhance worksheet functionality with improved mutation handling and global toasts ([9d420a5](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/9d420a5d9effccfb57173814d773ba548adb6351))
- Implement document upload functionality with improved mutation handling ([bd06fad](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/bd06fadf5b7e9da69a7aa81516d8df69884b6b4d))
- Implement customizable dialog management system with validation capabilities ([d6419b4](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d6419b41c390f982b8e04d59bfdca1db7bdd4fb4))
- Implement dialog management for order rejection with validation ([d55a2db](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d55a2db7831fd7f081d551a6ff555f9c2001f4c5))
- Enhance useDialogs to support nullable schemas and improve validation handling ([9311bc4](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/9311bc49b7502902455857085eafd27d40360ce6))
- Update document upload handling to manage order status on offering document upload ([21589ab](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/21589ab4ebeba991c13df99fb66131fec541e6b7))
- Add cover transportation and accommodation flags to orders and worksheets ([ec524ad](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ec524ad5b360d96b175f7da5fdb9976295b55574))
- Add order-related functionality to worksheets ([0f64672](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/0f646727964a1b18e9fe3b5b4777b59ee803a01d))
- Simplify testing relation handling in order queries and types ([90ad50b](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/90ad50b8721958a044cc572de7713faf0ced2f7b))
- Update order status and history labels for clarity ([fd63fdd](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/fd63fdd37ab39d7a538dd568f440a9ff7656bb77))
- Swap titles and URLs for Worksheets and Testings in back office menu ([2c276d2](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/2c276d23ff81ae958f162ef4d9bb98c26a058295))
- Add worksheets and related entities to database schema ([7607c76](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7607c768049c69b4f1c92ed6d0fda663fea8ba9f))
- Simplify order status flow by removing obsolete statuses ([54225cd](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/54225cdd23dc7c4cf0f61f17f3b7f22a294c9746))
- Update worksheet schema and queries to support optional scheduling dates ([f463749](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/f463749bea8927d7fd7d0673fd8b510bad323865))
- Add positions table and relations, update employee schema and seeding logic ([e5c2374](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/e5c237428512dfb831de8e0876833a127f13918d))
- Update employee queries and worksheet schemas to use UUID v7 for IDs ([98659eb](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/98659ebaaf19de23ce2228f1f18a5c68a933bbdd))
- Add position management functionality ([ba526fd](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ba526fdeb81744e8f321cf8da6faed3f3d6fa925))
- Add operational costs to worksheets ([46e77be](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/46e77be9814678147128ac838ad3b4fc9a8c7d4a))
- Enable editing of operational costs for worksheets in draft or revision status ([713dd9a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/713dd9a963f20cb05754bd8330fc4c5b8a098822))
- Refactor date handling in calculateDuration and formatDateRange functions ([9c18c77](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/9c18c770e7bbe26143558cc1167a732938430e5f))
- Add employee management features including create and edit functionality ([7ca4a3b](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7ca4a3bc78ea3f706d6109d4570964c58800bc63))
- Remove jadwal-personel-template component and associated logic ([80aa237](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/80aa237047f6839836152efaafec989306624435))
- Add operational costs validation based on transportation and accommodation coverage ([7f8e774](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7f8e77479a3b4e66e317c0945e37f4ebe795165c))
- Add chemical materials and tools management ([be93e58](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/be93e58992c318ba4fd7dd9ec671fcd38fedc04a))
- Add worksheet chemical materials management ([a755ff8](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/a755ff8de84cb6d9f00ce1e9b7ddac4ecd885cfb))
- Enhance permission handling with additional actions and improved code formatting ([0bf4074](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/0bf407475b0664aa8e87873905ec1d8bb9280bae))
- Add permission gate for detail access in testing and worksheets routes ([a4a3d2f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/a4a3d2fd0ac6f2aaa4f523606487685b33714090))
- Enhance permission handling for worksheets and update input validation ([771ba4a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/771ba4ae526691097ee88521e51d5ba16c2ec6a2))
- Add ShowFor component for auth and permission-based rendering; implement useUserProfile hook; update jadwal-personel route with permission check ([8851020](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/885102062fc3d38fc0a139d3109b22eb4c68a9fb))
- Update parameter validation to use uuidv7 and enhance permission checks in parameter tool router ([8d21ccc](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/8d21ccce123ab9be2749c0ba82cdac00bd95ffaa))
- Add action buttons to WorksheetHeaderCard for saving and exporting in various routes ([d2d0121](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d2d0121844f0a12c5d9952ba890df9a56691bd04))
- Add chemical materials management routes and components ([3b96c6b](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/3b96c6b4bceef638a28e6d2a5175ad0e970f1f0c))
- Update subtitles for Testing and Worksheet management components ([8920c71](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/8920c716b90086a93650d0081851f10cdd08b600))
- Remove unused dialog imports and update WorksheetHeaderCard to include actionButton prop ([1b933b9](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/1b933b950fb3da7af3f31931b2cbca53feab504e))
- Add tool calibration management functionality ([581fe2c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/581fe2c73f0b2d70832c68904ee4a2b9fea90b69))
- Enhance tool calibration routes and UI components ([e06fb38](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/e06fb385f1eb081b111fce51c348ff8fc2703677))
- Update calibration date column to use date format ([4b0c54e](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4b0c54ea52c27f79f84d00e11b407e3bf5664eb7))
- Implement calibration detail and certificate tabs with validation ([fc146a1](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/fc146a183c3394f55d92ea34fbf37f95a5f1621c))
- Add calibration certificate and documentation components with API integration ([46e2f8f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/46e2f8f9bc8c45242a3d2d6b7343c656bb33290b))
- Enhance calibration detail page with documentation upload functionality and skeleton loading states ([85af99a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/85af99a64967dd3b52b90ee2eb6ea519757214e3))
- Add documentation modal route and integrate navigation in calibration documentation component ([875ab3b](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/875ab3b17265c51eff49af059c59b19583ecfad9))
- Remove documentation modal route and integrate documentation image modal in calibration detail ([d7b8c78](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d7b8c7854d7d429cfe1bf03cbf07415ffd388e11))
- Add gap styling to CarouselContent in CalibrationDocumentation component ([d683901](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d6839011f0bd77e682a656377af8944844ca1734))
- Implement tool calibration edit functionality with form handling and validation ([2cdd625](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/2cdd625c77c825e72bb20eba5850774dc4721b13))
- Add permission check for viewing tool calibration details ([a1be1f2](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/a1be1f22afeb6f8fcf874e2d6646bf0b2af0a25e))
- Update chemical materials create route with form handling and validation ([374875a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/374875a7eaba6bb788adeac79e91bdeea36cf696))
- Enhance logging in RateLimiterService, FileSystemProvider, and MinioProvider ([5dca335](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/5dca335042ea55b5ad29d7f9bcbcf594b0ab8a10))
- Replace console logging with logInfo for server startup and file requests ([4e9fd3c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4e9fd3cace39b5740065b10c18545c1fd02c31f9))
- Add loading skeleton and header to documentation image modal ([16d87d6](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/16d87d6b441131e339afb38a66f84b845a4ff642))
- Refactor chemical materials routes to use chemicalMaterialId and remove deprecated edit route ([c771dca](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c771dcaed977ed1565360249a31a09f5b1695148))
- Add parameter chemical management with create, update, and delete functionalities ([ee06aba](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ee06abaabc01385a8f280834ce174de858554fab))
- Add changelog generation support with git-cliff ([2fcd42a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/2fcd42af1da333b9f05bf888546dd6a36216e0e7))
- Enhance changelog scripts with additional generation options ([4f7bece](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4f7bece24d37db8d7b4b7292cb6cdca6e3cd291d))
- **pdf:** Add new Roboto SemiCondensed font variants and register Arimo and Liberation Sans fonts ([087ce3f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/087ce3f7d6f1eef63b4a9bff5d518facabbae14d))
- **pdf:** Remove deprecated Roboto font files ([e5450c4](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/e5450c463989344e69fa789c9c0fa5f7c629b7fc))
- **pdf:** Refactor font registration and utility functions for PDF generation ([206891d](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/206891dfcb931c01d07d500ffb147f046fd9b26a))
- **pdf:** Add operational costs to mock data and implement table component for PDF generation ([3b0f965](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/3b0f965f2179f16d281655702bed44ad14b802ec))
- **pdf:** Remove offering letter generation logic from order router ([66831a7](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/66831a7fc5a58b3d11d5df956f57a6cf7e316be4))
- **pdf:** Remove QR code data and verification URL from offering letter header ([1c1044a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/1c1044ab8a13d4d319e948d0018f25844ce7432f))
- **pdf:** Implement offering letter generation with operational costs and refactor related components ([d63933c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d63933c1bac84c9d1a64e0eeaa0bcf53d7ce5f03))
- **pdf:** Refactor Letterhead component to use Tailwind styles and update layout ([4889253](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4889253f564d20238b8cc1a9f381e425b2b1c3ce))
- **deps:** Add date-fns library and set default locale to Indonesian ([4a0afa4](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4a0afa40bb7cd46016d9a2d7a024c16f76b7f212))
- Add employee type and NIP fields to schema and seed data ([5578ded](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/5578dedfeb0a7a85babdb0ebe63aec1bb52bb01c))
- Add NIP and employee type fields to employee creation and editing forms ([c2cdbce](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c2cdbcebc5066404b19f462d8526ec77947a3a7e))
- **pdf:** Add reusable PDF components and update dependencies ([ac5089a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ac5089a0ed56b207605600b8594ad9eb3e2fc199))
- **turborepo:** Add task configuration reference and environment variable gotchas documentation ([f5fb6d9](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/f5fb6d94ec1c2685db1ea932b5dcb8088e5e399e))
- **date-formatting:** Replace toLocaleDateString with date-fns format for consistent date formatting ([7cc571f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7cc571f9694336dbfbfa8f19d47f58abd739562f))
- **worksheets:** Enhance editability checks and display alerts for non-editable worksheets ([b4b652d](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/b4b652ddeb1cf9212cd95a91a96d90d43a2869d5))
- **worksheets:** Implement query to fetch all worksheets for schedule calendar display ([96ff809](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/96ff809b4da1564df14e92bd714710353258a30e))
- Add survey management features including questions, responses, and feedback ([4fddea1](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4fddea119215621db94df9e525ecd2280d26ac20))
- **survey:** Enhance survey response handling and redirect logic in survey-kepuasan route ([8b98c00](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/8b98c00b13026d94574d9c95d4b25feceb2436df))
- **pdf:** Enhance SectionHeader component with body styling options; add SPK and Tagihan PDF generators and templates ([90af94b](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/90af94b133784ace77556b8c462ab15a4dbd2fde))
- Restructure environment configuration and enhance security measures; add pagination schema and skeleton components ([d41481f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/d41481f1eb40eac970d13c9bfa74970b724d2931))
- **auto-form:** Implement AutoForm component with dynamic field rendering and validation; integrate with KBLI creation route ([e5ad5bc](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/e5ad5bcd8069228874f9339348d2f56ed19ff52f))
- **data-table:** Implement useDataTableRouter hook for improved data handling; refactor filtering and pagination logic ([fa9386c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/fa9386c8355f443cb055192dd9f6e0c6ae1790c2))
- Implement useOptimisticMutation hook for enhanced optimistic updates; refactor CRUD action cell and create route to utilize new hook ([1db7073](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/1db7073129d4dce869cd161fefe8d7ba9771b8ac))
- **auth:** Refactor access token functions for clarity and consistency; update validateToken to use new decryptAccessToken function ([7d226d9](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7d226d98d9550b4664fef9fe8e89c87da9b34d2c))
- Enhance type safety across components and hooks; refactor various types to use specific types instead of 'any' ([9bcf0fc](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/9bcf0fce9f864326b104d5484386b703fa1c9002))

### 🐛 Bug Fixes

- Update clusterId type to string and improve loading state handling in TestingTable component ([32e1e8c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/32e1e8cee000f832eabe7f967082094bc4372bcb))
- Correct syntax error in exampleRouter definition ([594e026](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/594e026e7d7e971aff9d7072a09511ce20b13f65))
- Simplify loading indicator rendering in ButtonWithLoading component ([fe5b5ff](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/fe5b5ff02d2056b64d33c5973aa9d9ba8e724a55))
- Update permission type to use defined Permission type for better type safety ([9fa079a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/9fa079a2c7579615b0b74b690d5bf845fe4335e7))
- Update permission levels for testing and worksheets routes ([7e49ca5](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7e49ca5bc2d82adf56e16db39fab26b7a93b51a0))
- Correct navigation path in ToolCalibration component ([5bca58e](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/5bca58ee0c2607aa772510efa8f1e9b886158ea2))
- The delete calibration to soft delete not permanetly deleted ([c6746f5](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/c6746f57bc1f797fcc41bcd505090f45b5655ffb))
- **pdf:** Simplify border conditionals in offering letter component ([2c68a31](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/2c68a31cd1b45c7bf0daddf5bd53d83a99d2790f))
- **mockData:** Update value fields in mock data for testing ([7877a2c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/7877a2ccf6557066e0b49c42e875d609509cf678))
- **pdf:** Update mock data IDs and simplify border conditionals in offering letter component ([54198f9](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/54198f909198358a6bbc3237a4d86baa5d0393f7))
- Update labels and placeholders for employee and position forms ([60f54e6](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/60f54e671bb456b20f31af4490e7028f3b52da1c))
- **tsconfig:** Remove baseUrl configuration ([2b3bde9](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/2b3bde9c5aa05b1592a3ebebda7e3bb3a334b174))
- **tsconfig:** Standardize baseUrl configuration across projects ([70f757a](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/70f757a9c66e9e15612118fc4ba70b3ee3a357e8))
- **tables:** Update key prop in tool and bahan table rows to use index for stability ([45de212](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/45de2129de4326cb37e7eb07a65015d54fd44464))
- Update permission checks for KBLI and role editing routes ([fa9353f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/fa9353f57e1fa1e850dfdd5a2f7360fa9feca860))

### 📦 Other Changes

- Add migration entry for deep beast (version 7) in journal ([9d2441f](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/9d2441f98c202d4a091fe981b47234c76dbcab3b))
- Refactor API routers to utilize runEffect utility for error handling

- Replaced Effect.runPromise with runEffect in cluster, district, kbli, parameter-categories, parameter-tool, parameter, permission, province, regency, role, tool, user-company-testing-location, user-company, user, and village routers.
- Introduced runEffect utility function to handle Effect execution and error management.
- Created a new error handling utility in the utils package for consistent TRPC error responses.
- Updated user queries to use the new TRPCError class from the utils package.
- Added necessary dependencies in package.json and pnpm-lock.yaml for effect and trpc/server. ([f7b5330](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/f7b5330667d6f60aa2edb3f543d11398a794ed7b))
- Refactor transaction routes and forms

- Updated the orientation of radio buttons in the company creation form to horizontal.
- Changed route definitions for parameter categories and testing table components to include a specific transaction ID.
- Deleted unused routes for 'pengujian' and 'transaksi'.
- Created new routes for transaction steps (1 to 4) with appropriate components.
- Implemented a redirect from '/transaksi' to '/transaksi/1' for better navigation flow.
- Enhanced the form for creating user companies with validation and improved user experience. ([dd3abc7](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/dd3abc749af47f2adccae545a16ea0eb2bdfa6f6))
- Merge branches 'feature/order' and 'main' of https://github.com/rizrmdhn/tepian-k3 into feature/order ([204a41c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/204a41c468ab95ece726b39872eaa2ca9b5b2324))
- Add migration entry for version 7 with tag '0003_foamy_gambit' ([65d5a17](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/65d5a17c38e15caa548514c9cb29d9476c97c866))
- Refactor migration journal and update testing queries

- Cleaned up the migration journal by removing obsolete entries and updating the first entry's tag and timestamp.
- Enhanced testing queries to ensure a worksheet is created from "kaji ulang" before proceeding with testing creation.
- Removed unused functions related to linking worksheets to testing and creating worksheets from testing, streamlining the worksheet queries. ([13464dc](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/13464dc09970678fc04f377f983d1652eebceebd))
- Add migration entry for wide karnak version 7 in journal ([85d1414](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/85d14145f103bcc98a7c5d69491ebe04b4b1cdd3))
- Add migration entry for version 7: 0005_right_iron_lad ([71621ac](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/71621ac2e11949e11c6055e8d77ca80d530a7144))
- Refactor file upload components and improve error handling

- Updated MultipleFileUpload, MultipleImageUpload, SingleFileUpload, and SingleImageUpload components to use destructured props for onBlur and name.
- Enhanced getFileExtension function to handle edge cases for file extensions.
- Improved file type handling in upload components to avoid pushing undefined types.
- Refactored simulateUpload function to use a single file variable for clarity.
- Added checks for undefined values in various functions to prevent runtime errors.
- Modified CRUD action cell configuration to simplify type parameters.
- Improved checkout route logic for better readability and performance.
- Updated status route to include revision history check.
- Enhanced personnel schedule page to handle edge cases for week start and end dates.
- Updated error handling in the root component to prevent crashes on undefined lines.
- Refactored cart and testing form stores to handle empty data cases more gracefully.
- Updated TypeScript configuration files across multiple packages for consistency and improved type checking.
- Introduced environment variable definitions for auth, db, and services packages.
- Added a root tsconfig.json to manage project references for better organization. ([b3a8983](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/b3a8983a4b2920c4fbc038fdb2c70ecce0fdf502))

### 🚜 Refactor

- Replace logger with structured logging in user and village queries ([09731b1](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/09731b107d8ad84f7e56548958cda62c0b161098))
- Remove console log from onHoverDetail in ActionCell ([484d20d](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/484d20d7e91d7602cb41146be931bb58c6ecdc89))
- Remove Redis Pub/Sub and SSE manager implementations ([87fbede](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/87fbedeaba8f5b60af180bf7775cb7e488f04421))
- Simplify globalEnv configuration in turbo.json ([f9c0601](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/f9c0601bc96b570ed8f8b2ec25ae0180e2a9a26e))
- Clean up notification creation mutation formatting ([0b11760](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/0b11760a7f9f4187a9ab42674ec1b262e2166f81))
- Improve logWithContext to handle metadata correctly ([2376183](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/2376183310b466fcdd439e547fd89f0e5b0d79a2))
- Remove PDF and QR code generation services ([837ef98](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/837ef98c2f83425cd0a7d10882ad0592227f8360))
- **status:** Streamline worksheet handling and improve dialog components ([4117e46](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/4117e46696b8a8b22ee8f540fb2ba4519d16aef7))

### ⚙️ Miscellaneous Tasks

- Add react19 catalog with specific versions for react and related types ([0ed7e6c](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/0ed7e6c8aaea5a74e93047e60b9745223013b039))
- **auth, db, services:** Remove unused environment variable files and related code ([fa4d809](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/fa4d809eb7038a8f9cf2bb96adce2e4dcf13f42c))
- Remove unnecessary "use client" directives from multiple components ([b4a8395](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/b4a8395c6bfa275605c3e006a3d51bdec7f7a4b3))
- Remove unused promt.txt file to clean up the repository ([ab3aea5](https://github.com/YOUR_USERNAME/YOUR_REPO/commit/ab3aea5ea806c749710ed403617293a03420c59a))

<!-- generated by git-cliff -->
