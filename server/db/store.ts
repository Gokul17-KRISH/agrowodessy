import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  DemandContract,
  CropCommitment,
  QualityReport,
  Delivery,
  Notification,
  DistrictSaturationIntelligence,
  SaturationMetrics,
  SystemMetrics
} from '../../src/types.js';
import { isMongoConnected } from './mongodb.js';
import { MongoUserModel } from './models/User.js';
import { MongoDemandContractModel } from './models/DemandContract.js';
import { MongoCropCommitmentModel } from './models/CropCommitment.js';
import { MongoQualityReportModel } from './models/QualityReport.js';
import { MongoDeliveryModel } from './models/Delivery.js';
import { MongoNotificationModel } from './models/Notification.js';

class DatabaseStore {
  public users: User[] = [];
  public demands: DemandContract[] = [];
  public commitments: CropCommitment[] = [];
  public qualityReports: QualityReport[] = [];
  public deliveries: Delivery[] = [];
  public notifications: Notification[] = [];

  private dataFilePath = path.join(process.cwd(), 'data', 'store.json');

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.demands = parsed.demands || [];
        this.commitments = parsed.commitments || [];
        this.qualityReports = parsed.qualityReports || [];
        this.deliveries = parsed.deliveries || [];
        this.notifications = parsed.notifications || [];

        if (this.users.length > 0 && this.demands.length > 0) {
          this.ensureSystemUsers();
          console.log(`[Store] Loaded ${this.users.length} users, ${this.demands.length} demands, ${this.commitments.length} commitments, ${this.deliveries.length} deliveries.`);
          return;
        }
      }
    } catch (err) {
      console.warn('[Store] Could not read JSON store, generating initial seed data...', err);
    }

    this.seedData();
    this.ensureSystemUsers();
    this.saveToDisk();
  }

  public async syncWithMongo() {
    if (!isMongoConnected()) return;

    try {
      console.log('[Store] Syncing with MongoDB Atlas cluster...');
      const dbUsersCount = await MongoUserModel.countDocuments();
      const dbDemandsCount = await MongoDemandContractModel.countDocuments();

      if (dbUsersCount === 0 && dbDemandsCount === 0) {
        console.log('[Store] Seeding MongoDB Atlas collections from store snapshot...');
        if (this.users.length > 0) {
          await MongoUserModel.insertMany(this.users.map(u => ({ ...u, _id: undefined })) as any);
        }
        if (this.demands.length > 0) {
          await MongoDemandContractModel.insertMany(this.demands.map(d => ({ ...d, _id: undefined })) as any);
        }
        if (this.commitments.length > 0) {
          await MongoCropCommitmentModel.insertMany(this.commitments.map(c => ({ ...c, _id: undefined })) as any);
        }
        if (this.qualityReports.length > 0) {
          await MongoQualityReportModel.insertMany(this.qualityReports.map(q => ({ ...q, _id: undefined })) as any);
        }
        if (this.deliveries.length > 0) {
          await MongoDeliveryModel.insertMany(this.deliveries.map(d => ({ ...d, _id: undefined })) as any);
        }
        if (this.notifications.length > 0) {
          await MongoNotificationModel.insertMany(this.notifications.map(n => ({ ...n, _id: undefined })) as any);
        }
        console.log('[Store] 🟢 MongoDB Atlas collections seeded successfully!');
      } else {
        console.log('[Store] Fetching live dataset from MongoDB Atlas collections...');
        const mongoUsers = await MongoUserModel.find().lean();
        const mongoDemands = await MongoDemandContractModel.find().lean();
        const mongoCommitments = await MongoCropCommitmentModel.find().lean();
        const mongoQuality = await MongoQualityReportModel.find().lean();
        const mongoDeliveries = await MongoDeliveryModel.find().lean();
        const mongoNotifications = await MongoNotificationModel.find().lean();

        if (mongoUsers.length > 0) this.users = mongoUsers as any;
        if (mongoDemands.length > 0) this.demands = mongoDemands as any;
        if (mongoCommitments.length > 0) this.commitments = mongoCommitments as any;
        if (mongoQuality.length > 0) this.qualityReports = mongoQuality as any;
        if (mongoDeliveries.length > 0) this.deliveries = mongoDeliveries as any;
        if (mongoNotifications.length > 0) this.notifications = mongoNotifications as any;

        this.ensureSystemUsers();
        this.saveToDisk();
        console.log(`[Store] 🟢 MongoDB Atlas synced: ${this.users.length} Users, ${this.demands.length} Demands, ${this.commitments.length} Commitments.`);
      }
    } catch (err) {
      console.warn('[Store] Error during MongoDB Atlas sync:', err);
    }
  }

  public async saveToMongo() {
    if (!isMongoConnected()) return;
    try {
      for (const u of this.users) {
        await MongoUserModel.updateOne({ id: u.id }, { $set: u as any }, { upsert: true });
      }
      for (const d of this.demands) {
        await MongoDemandContractModel.updateOne({ id: d.id }, { $set: d as any }, { upsert: true });
      }
      for (const c of this.commitments) {
        await MongoCropCommitmentModel.updateOne({ id: c.id }, { $set: c as any }, { upsert: true });
      }
      for (const q of this.qualityReports) {
        await MongoQualityReportModel.updateOne({ id: q.id }, { $set: q as any }, { upsert: true });
      }
      for (const del of this.deliveries) {
        await MongoDeliveryModel.updateOne({ id: del.id }, { $set: del as any }, { upsert: true });
      }
      for (const n of this.notifications) {
        await MongoNotificationModel.updateOne({ id: n.id }, { $set: n as any }, { upsert: true });
      }
    } catch (err) {
      console.warn('[Store] Error writing to MongoDB Atlas:', err);
    }
  }

  public saveToDisk() {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.dataFilePath,
        JSON.stringify(
          {
            users: this.users,
            demands: this.demands,
            commitments: this.commitments,
            qualityReports: this.qualityReports,
            deliveries: this.deliveries,
            notifications: this.notifications
          },
          null,
          2
        )
      );
      this.saveToMongo().catch(err => console.warn('[Store] Background save to Mongo failed:', err));
    } catch (e) {
      console.warn('[Store] Failed writing persistent store:', e);
    }
  }

  public ensureSystemUsers() {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('demo1234', salt);
    const nowIso = new Date().toISOString();

    const defaultUsers: User[] = [
      {
        id: 'USR-ADMIN',
        name: 'AgriLink Admin',
        email: 'admin@agrilink.demo',
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        phone: '+91 94432 10001',
        district: 'Chennai',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: demoPasswordHash
      },
      {
        id: 'USR-FARMER-1',
        name: 'Gopalakrishnan R.',
        email: 'farmer@agrilink.demo',
        role: 'FARMER',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '+91 98422 12345',
        district: 'Coimbatore',
        farmSizeAcres: 12.5,
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: demoPasswordHash
      },
      {
        id: 'USR-BUYER-1',
        name: 'Reliance Retail (Agri Div)',
        email: 'buyer@agrilink.demo',
        role: 'BUYER',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        phone: '+91 99655 88888',
        district: 'Coimbatore',
        businessName: 'Reliance Retail Ltd',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: demoPasswordHash
      },
      {
        id: 'USR-GRADER-1',
        name: 'Suresh Kumar',
        email: 'grader@agrilink.demo',
        role: 'GRADER',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        phone: '+91 93600 77777',
        district: 'Coimbatore',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: demoPasswordHash
      }
    ];

    for (const defUser of defaultUsers) {
      const idx = this.users.findIndex(u => u.email.toLowerCase() === defUser.email.toLowerCase());
      if (idx === -1) {
        this.users.push(defUser);
      } else {
        // Update password hash if needed
        this.users[idx] = {
          ...defUser,
          ...this.users[idx],
          passwordHash: this.users[idx].passwordHash || defUser.passwordHash
        };
      }
    }
  }

  private seedData() {
    console.log('[Store] Seeding initial AgriLink digital market dataset...');
    const nowIso = new Date().toISOString();

    // 1. Seed some fallback users (extra farmers, buyers, graders)
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('demo1234', salt);

    this.users = [
      {
        id: 'USR-FARMER-2',
        name: 'Palani Swamy',
        email: 'palani@agrilink.demo',
        role: 'FARMER',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        phone: '+91 97866 54321',
        district: 'Erode',
        farmSizeAcres: 8.0,
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: demoPasswordHash
      },
      {
        id: 'USR-FARMER-3',
        name: 'Muthusamy K.',
        email: 'muthu@agrilink.demo',
        role: 'FARMER',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        phone: '+91 94880 77112',
        district: 'Tiruppur',
        farmSizeAcres: 15.0,
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: demoPasswordHash
      },
      {
        id: 'USR-BUYER-2',
        name: 'FarmFresh Foods Co.',
        email: 'farmfresh@agrilink.demo',
        role: 'BUYER',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        phone: '+91 91234 56789',
        district: 'Erode',
        businessName: 'FarmFresh Corp',
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash: demoPasswordHash
      }
    ];

    // 2. Seed Buyer crop demands (DemandContracts)
    this.demands = [
      {
        id: 'DEM-001',
        buyerId: 'USR-BUYER-1',
        buyerName: 'Reliance Retail (Agri Div)',
        businessName: 'Reliance Retail Ltd',
        cropName: 'Tomato',
        quantityRequiredKg: 10000,
        quantityCommittedKg: 8500,
        pricePerKg: 35,
        targetMonth: 'November 2026',
        district: 'Coimbatore',
        terms: 'Payment released instantly upon Grader verification of moisture < 10% and size > 4cm.',
        qualityRequirements: 'Size Class A/B, No surface pests, Moisture maximum 12%',
        status: 'OPEN',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'DEM-002',
        buyerId: 'USR-BUYER-1',
        buyerName: 'Reliance Retail (Agri Div)',
        businessName: 'Reliance Retail Ltd',
        cropName: 'Onion',
        quantityRequiredKg: 15000,
        quantityCommittedKg: 15000, // Fully committed, alert level OPTIMAL
        pricePerKg: 42,
        targetMonth: 'November 2026',
        district: 'Coimbatore',
        terms: 'Buyer deposits 100% in escrow. Farmers ship to depot.',
        qualityRequirements: 'Well cured bulbs, double skin intact, size > 55mm.',
        status: 'FULLY_COMMITTED',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'DEM-003',
        buyerId: 'USR-BUYER-2',
        buyerName: 'FarmFresh Foods Co.',
        businessName: 'FarmFresh Corp',
        cropName: 'Turmeric',
        quantityRequiredKg: 5000,
        quantityCommittedKg: 6200, // OVER-SATURATED (High density alerts)
        pricePerKg: 135,
        targetMonth: 'December 2026',
        district: 'Erode',
        terms: 'Grade A Erode Turmeric bulbs only. Settle payment via direct bank transfer escrow release.',
        qualityRequirements: 'Curcumin contents > 4.5%, moisture < 9%.',
        status: 'OPEN',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'DEM-004',
        buyerId: 'USR-BUYER-2',
        buyerName: 'FarmFresh Foods Co.',
        businessName: 'FarmFresh Corp',
        cropName: 'Maize',
        quantityRequiredKg: 30000,
        quantityCommittedKg: 5000, // Under-supplied (Need seeding!)
        pricePerKg: 24,
        targetMonth: 'November 2026',
        district: 'Tiruppur',
        terms: 'Moisture < 14%. Payment within 24 hours of grader validation.',
        qualityRequirements: 'Yellow dent maize, foreign matter < 2%, damaged kernels < 5%.',
        status: 'OPEN',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'DEM-005',
        buyerId: 'USR-BUYER-1',
        buyerName: 'Reliance Retail (Agri Div)',
        businessName: 'Reliance Retail Ltd',
        cropName: 'Rice (Ponni)',
        quantityRequiredKg: 20000,
        quantityCommittedKg: 4000,
        pricePerKg: 55,
        targetMonth: 'December 2026',
        district: 'Trichy',
        terms: 'Double polished Ponni rice, crop year 2026.',
        qualityRequirements: 'Moisture < 12%, broken grains < 3%.',
        status: 'OPEN',
        createdAt: nowIso,
        updatedAt: nowIso
      }
    ];

    // 3. Seed crop commitments from farmers
    this.commitments = [
      {
        id: 'COM-001',
        farmerId: 'USR-FARMER-1',
        farmerName: 'Gopalakrishnan R.',
        demandContractId: 'DEM-001',
        cropName: 'Tomato',
        quantityKg: 5000,
        district: 'Coimbatore',
        plantingDate: '2026-08-01',
        harvestDateAvailable: '2026-11-10',
        status: 'SEEDED',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'COM-002',
        farmerId: 'USR-FARMER-2',
        farmerName: 'Palani Swamy',
        demandContractId: 'DEM-001',
        cropName: 'Tomato',
        quantityKg: 3500,
        district: 'Coimbatore',
        plantingDate: '2026-08-05',
        harvestDateAvailable: '2026-11-15',
        status: 'PLANNED',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'COM-003',
        farmerId: 'USR-FARMER-1',
        farmerName: 'Gopalakrishnan R.',
        demandContractId: 'DEM-002',
        cropName: 'Onion',
        quantityKg: 10000,
        district: 'Coimbatore',
        plantingDate: '2026-07-20',
        harvestDateAvailable: '2026-11-01',
        status: 'HARVESTED', // Harvested and ready for logistics!
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'COM-004',
        farmerId: 'USR-FARMER-3',
        farmerName: 'Muthusamy K.',
        demandContractId: 'DEM-002',
        cropName: 'Onion',
        quantityKg: 5000,
        district: 'Coimbatore',
        plantingDate: '2026-07-25',
        harvestDateAvailable: '2026-11-05',
        status: 'SEEDED',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'COM-005',
        farmerId: 'USR-FARMER-2',
        farmerName: 'Palani Swamy',
        demandContractId: 'DEM-003',
        cropName: 'Turmeric',
        quantityKg: 4000,
        district: 'Erode',
        plantingDate: '2026-05-10',
        harvestDateAvailable: '2026-12-05',
        status: 'SEEDED',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'COM-006',
        farmerId: 'USR-FARMER-1',
        farmerName: 'Gopalakrishnan R.',
        demandContractId: 'DEM-003',
        cropName: 'Turmeric',
        quantityKg: 2200,
        district: 'Erode',
        plantingDate: '2026-05-15',
        harvestDateAvailable: '2026-12-08',
        status: 'SEEDED',
        createdAt: nowIso,
        updatedAt: nowIso
      },
      {
        id: 'COM-007',
        farmerId: 'USR-FARMER-3',
        farmerName: 'Muthusamy K.',
        demandContractId: 'DEM-004',
        cropName: 'Maize',
        quantityKg: 5000,
        district: 'Tiruppur',
        plantingDate: '2026-08-10',
        harvestDateAvailable: '2026-11-20',
        status: 'PLANNED',
        createdAt: nowIso,
        updatedAt: nowIso
      }
    ];

    // 4. Quality Reports
    this.qualityReports = [
      {
        id: 'QR-001',
        graderId: 'USR-GRADER-1',
        graderName: 'Suresh Kumar',
        cropCommitmentId: 'COM-003', // Onions
        grade: 'A',
        parameters: {
          moisturePct: 8.5,
          avgSizeCm: 6.2,
          defectsPct: 1.5,
          organicRating: 4.8
        },
        notes: 'Premium grade onions. Shell dry, skins are tight, shape spherical. Fully qualified for direct corporate packaging.',
        certifiedAt: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ];

    // 5. Escrow and shipping deliveries
    this.deliveries = [
      {
        id: 'DLV-001',
        demandContractId: 'DEM-002',
        cropName: 'Onion',
        buyerId: 'USR-BUYER-1',
        buyerName: 'Reliance Retail (Agri Div)',
        farmerId: 'USR-FARMER-1',
        farmerName: 'Gopalakrishnan R.',
        cropCommitmentId: 'COM-003',
        graderId: 'USR-GRADER-1',
        graderName: 'Suresh Kumar',
        quantityDeliveredKg: 10000,
        pricePerKg: 42,
        totalAmount: 420000, // 10000 * 42 = 4.2 Lakhs
        escrowStatus: 'HELD_IN_ESCROW', // Fund locked in escrow by buyer
        deliveryStatus: 'QUALITY_CERTIFIED', // Graded grade A, now ready for packaging transit
        trackingTimeline: [
          {
            status: 'PENDING',
            timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
            updatedBy: 'System',
            description: 'Delivery record generated following Harvest notification.'
          },
          {
            status: 'RECEIVED',
            timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedBy: 'USR-GRADER-1',
            description: 'Crop bulk arrived at Coimbatore grading station. Checked in.'
          },
          {
            status: 'QUALITY_CERTIFIED',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            updatedBy: 'USR-GRADER-1',
            description: 'Quality report certified as Grade A. Escrow status updated to HELD_IN_ESCROW.'
          }
        ],
        qualityReportId: 'QR-001',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: nowIso
      },
      {
        id: 'DLV-002',
        demandContractId: 'DEM-001',
        cropName: 'Tomato',
        buyerId: 'USR-BUYER-1',
        buyerName: 'Reliance Retail (Agri Div)',
        farmerId: 'USR-FARMER-1',
        farmerName: 'Gopalakrishnan R.',
        cropCommitmentId: 'COM-001',
        quantityDeliveredKg: 5000,
        pricePerKg: 35,
        totalAmount: 175000,
        escrowStatus: 'AWAITING_DEPOSIT', // Buyer has not deposited escrow cash yet
        deliveryStatus: 'PENDING',
        trackingTimeline: [
          {
            status: 'PENDING',
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            updatedBy: 'System',
            description: 'Waiting for Buyer deposit confirmation to activate logistics.'
          }
        ],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        updatedAt: nowIso
      }
    ];

    // 6. Notifications
    this.notifications = [
      {
        id: 'NOT-001',
        recipientId: 'USR-FARMER-1',
        title: 'New Crop Demand',
        message: 'Reliance Retail posted a contract for Tomato (10,000 Kg) in Coimbatore district at ₹35/Kg.',
        type: 'DEMAND',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'NOT-002',
        recipientId: 'USR-BUYER-1',
        title: 'Quality Verification Complete',
        message: 'Grader Suresh Kumar certified Gopalakrishnan R. Onion commitment as Grade A.',
        type: 'QUALITY',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'NOT-003',
        recipientId: 'USR-FARMER-1',
        title: 'Escrow Funds Secured',
        message: '₹4,20,000 has been secured in AgriLink Escrow for Onion delivery DLV-001.',
        type: 'ESCROW',
        isRead: false,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  // User Helper Operations
  public getUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === clean);
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public addUser(user: User): User {
    const existing = this.getUserByEmail(user.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }
    this.users.push(user);
    this.saveToDisk();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    } as User;

    this.saveToDisk();
    return this.users[index];
  }

  public sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // Demand Handlers
  public getDemands(): DemandContract[] {
    return this.demands;
  }

  public getDemandById(id: string): DemandContract | undefined {
    return this.demands.find(d => d.id === id);
  }

  public addDemand(demand: DemandContract): DemandContract {
    this.demands.push(demand);
    this.saveToDisk();
    return demand;
  }

  public updateDemand(id: string, updates: Partial<DemandContract>): DemandContract | undefined {
    const idx = this.demands.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.demands[idx] = {
      ...this.demands[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.demands[idx];
  }

  // Commitments
  public getCommitments(): CropCommitment[] {
    return this.commitments;
  }

  public getCommitmentsByFarmer(farmerId: string): CropCommitment[] {
    return this.commitments.filter(c => c.farmerId === farmerId);
  }

  public addCommitment(commitment: CropCommitment): CropCommitment {
    this.commitments.push(commitment);
    
    // Update quantityCommittedKg on demand contract
    const demand = this.demands.find(d => d.id === commitment.demandContractId);
    if (demand) {
      demand.quantityCommittedKg += commitment.quantityKg;
      if (demand.quantityCommittedKg >= demand.quantityRequiredKg) {
        demand.status = 'FULLY_COMMITTED';
      }
      demand.updatedAt = new Date().toISOString();
    }
    
    this.saveToDisk();
    return commitment;
  }

  public updateCommitment(id: string, updates: Partial<CropCommitment>): CropCommitment | undefined {
    const idx = this.commitments.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.commitments[idx] = {
      ...this.commitments[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.commitments[idx];
  }

  // Quality Reports
  public getQualityReports(): QualityReport[] {
    return this.qualityReports;
  }

  public addQualityReport(report: QualityReport): QualityReport {
    this.qualityReports.push(report);
    // Also find referencing commitment and update status to HARVESTED or DELIVERED depending on details
    const commitment = this.commitments.find(c => c.id === report.cropCommitmentId);
    if (commitment) {
      if (report.grade === 'REJECTED') {
        // Can handle rejection flows
      } else {
        // Add delivery tracking if not already there
        const delivery = this.deliveries.find(d => d.cropCommitmentId === report.cropCommitmentId);
        if (delivery) {
          delivery.deliveryStatus = 'QUALITY_CERTIFIED';
          delivery.graderId = report.graderId;
          delivery.graderName = report.graderName;
          delivery.qualityReportId = report.id;
          delivery.trackingTimeline.push({
            status: 'QUALITY_CERTIFIED',
            timestamp: new Date().toISOString(),
            updatedBy: report.graderId,
            description: `Quality certified as Grade ${report.grade}. Notes: ${report.notes}`
          });
          delivery.updatedAt = new Date().toISOString();
        }
      }
    }
    this.saveToDisk();
    return report;
  }

  // Deliveries & Escrow
  public getDeliveries(): Delivery[] {
    return this.deliveries;
  }

  public getDeliveryById(id: string): Delivery | undefined {
    return this.deliveries.find(d => d.id === id);
  }

  public addDelivery(delivery: Delivery): Delivery {
    this.deliveries.push(delivery);
    this.saveToDisk();
    return delivery;
  }

  public updateDelivery(id: string, updates: Partial<Delivery>): Delivery | undefined {
    const idx = this.deliveries.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.deliveries[idx] = {
      ...this.deliveries[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.deliveries[idx];
  }

  // Notifications
  public getNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.recipientId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notification: Notification): Notification {
    this.notifications.push(notification);
    this.saveToDisk();
    return notification;
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Saturation Intelligence & Analytics
  public getDistrictSaturationData(): DistrictSaturationIntelligence[] {
    const districts = ['Coimbatore', 'Erode', 'Tiruppur', 'Salem', 'Trichy', 'Madurai'];
    const crops = ['Tomato', 'Onion', 'Turmeric', 'Maize', 'Rice (Ponni)'];

    return districts.map(district => {
      const metrics: SaturationMetrics[] = crops.map(crop => {
        // Calculate demand in this district for this crop
        const districtDemands = this.demands.filter(d => d.district.toLowerCase() === district.toLowerCase() && d.cropName.toLowerCase() === crop.toLowerCase());
        const totalDemand = districtDemands.reduce((acc, curr) => acc + curr.quantityRequiredKg, 0);

        // Calculate commitments in this district for this crop
        const districtCommitments = this.commitments.filter(c => c.district.toLowerCase() === district.toLowerCase() && c.cropName.toLowerCase() === crop.toLowerCase());
        const totalCommitment = districtCommitments.reduce((acc, curr) => acc + curr.quantityKg, 0);

        // Saturation Percentage
        const satPct = totalDemand > 0 ? Math.round((totalCommitment / totalDemand) * 100) : 0;
        
        let alertLevel: 'LOW' | 'OPTIMAL' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (satPct > 110) alertLevel = 'CRITICAL'; // Serious oversupply
        else if (satPct > 90) alertLevel = 'OPTIMAL';
        else if (satPct > 70) alertLevel = 'HIGH'; // Approaching oversupply
        else if (satPct > 0) alertLevel = 'LOW'; // Under-supplied
        
        const contributingFarmers = new Set(districtCommitments.map(c => c.farmerId)).size;

        return {
          cropName: crop,
          totalDemandKg: totalDemand || 1000 + Math.floor(Math.random() * 5000), // realistic fallback
          totalCommitmentKg: totalCommitment,
          saturationPercentage: satPct,
          alertLevel,
          contributingFarmers
        } as SaturationMetrics;
      });

      // Tailored actions
      const recommendations = metrics.map(m => {
        let action: 'PLANT' | 'AVOID' | 'MONITOR' = 'PLANT';
        let reason = `Market demand is high with very few commitments registered. Great opportunity.`;

        if (m.alertLevel === 'CRITICAL') {
          action = 'AVOID';
          reason = `Market commitments exceed demand by ${m.saturationPercentage - 100}%. High risk of price crash.`;
        } else if (m.alertLevel === 'HIGH') {
          action = 'MONITOR';
          reason = `Commitment saturation is at ${m.saturationPercentage}%. Monitor before initiating more planting cycles.`;
        } else if (m.alertLevel === 'OPTIMAL') {
          action = 'MONITOR';
          reason = `Demand is fully matched at ${m.saturationPercentage}%. Price stability is predicted.`;
        }

        return {
          cropName: m.cropName,
          action,
          reason
        };
      });

      return {
        district,
        lastUpdated: new Date().toISOString(),
        metrics,
        recommendations
      };
    });
  }

  public getSystemMetrics(): SystemMetrics {
    const activeDemands = this.demands.filter(d => d.status === 'OPEN' || d.status === 'FULLY_COMMITTED');
    const totalCommitmentKgs = this.commitments.reduce((acc, curr) => acc + curr.quantityKg, 0);
    const totalFarmers = this.users.filter(u => u.role === 'FARMER').length;
    const totalBuyers = this.users.filter(u => u.role === 'BUYER').length;
    
    // Escrow volume from deliveries in HELD_IN_ESCROW or RELEASED_TO_FARMER
    const escrowVolume = this.deliveries
      .filter(d => d.escrowStatus === 'HELD_IN_ESCROW' || d.escrowStatus === 'RELEASED_TO_FARMER')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const successfulDeliveries = this.deliveries.filter(d => d.deliveryStatus === 'DELIVERED').length;

    return {
      totalFarmers,
      totalBuyers,
      activeDemandsCount: activeDemands.length,
      totalCommitmentsKg: totalCommitmentKgs,
      escrowVolumeRupees: escrowVolume,
      successfulDeliveriesCount: successfulDeliveries,
      districtSaturationData: this.getDistrictSaturationData()
    };
  }
}

export const store = new DatabaseStore();
