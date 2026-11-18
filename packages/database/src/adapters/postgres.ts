import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql, eq, and, or, desc, asc } from 'drizzle-orm';
import type { Coordinate, BoundingBox } from '@modern-maps/types';
import * as schema from '../schema/index.js';
import type {
  DatabaseAdapter,
  CreateSavedPlaceInput,
  UpdateSavedPlaceInput,
  SavedPlaceWithDistance,
  SavedPlaceFilter,
  CreateCollectionInput,
  UpdateCollectionInput,
  PlaceCollectionWithPlaces,
  CreateMapFeatureInput,
  UpdateMapFeatureInput,
  AddSearchHistoryInput,
  CreateUserInput,
  UpdateUserPreferencesInput,
} from './types.js';
import type {
  User,
  UserPreferences,
  SavedPlace,
  PlaceCollection,
  CollectionItem,
  SearchHistoryItem,
  UserMapFeature,
  MapFeatureType,
} from '../schema/index.js';

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>;

export class PostgresDatabaseAdapter implements DatabaseAdapter {
  readonly isMemory = false;
  private client: postgres.Sql | null = null;
  private db: DrizzleDatabase;

  constructor(connectionStringOrClientOrDb: string | postgres.Sql | DrizzleDatabase) {
    if (typeof connectionStringOrClientOrDb === 'string') {
      this.client = postgres(connectionStringOrClientOrDb, { max: 10 });
      this.db = drizzle(this.client, { schema });
    } else if ('select' in connectionStringOrClientOrDb) {
      this.db = connectionStringOrClientOrDb;
      this.client = null;
    } else {
      this.client = connectionStringOrClientOrDb;
      this.db = drizzle(this.client, { schema });
    }
  }

  public getDb(): DrizzleDatabase {
    return this.db;
  }

  public getClient(): postgres.Sql | null {
    return this.client;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
    }
  }

  // --- Spatial Queries ---

  async findNearbyPlaces(
    userId: string | null | undefined,
    center: Coordinate,
    radiusMeters: number
  ): Promise<SavedPlaceWithDistance[]> {
    const [lng, lat] = center;

    // Use PostGIS ST_DWithin and ST_Distance on geography type for accurate meter distance
    const distanceSql = sql<number>`ROUND(ST_Distance(${schema.savedPlaces.geom}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography))`;

    const whereConditions = [
      sql`ST_DWithin(${schema.savedPlaces.geom}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})`,
    ];

    if (userId) {
      whereConditions.push(
        or(eq(schema.savedPlaces.userId, userId), sql`${schema.savedPlaces.userId} IS NULL`)!
      );
    }

    const rows = await this.db
      .select({
        id: schema.savedPlaces.id,
        userId: schema.savedPlaces.userId,
        providerId: schema.savedPlaces.providerId,
        name: schema.savedPlaces.name,
        formattedAddress: schema.savedPlaces.formattedAddress,
        category: schema.savedPlaces.category,
        latitude: schema.savedPlaces.latitude,
        longitude: schema.savedPlaces.longitude,
        geom: schema.savedPlaces.geom,
        notes: schema.savedPlaces.notes,
        customColor: schema.savedPlaces.customColor,
        customIcon: schema.savedPlaces.customIcon,
        createdAt: schema.savedPlaces.createdAt,
        updatedAt: schema.savedPlaces.updatedAt,
        distanceMeters: distanceSql,
      })
      .from(schema.savedPlaces)
      .where(and(...whereConditions))
      .orderBy(asc(distanceSql));

    return rows.map((r) => ({
      ...r,
      distanceMeters: Number(r.distanceMeters),
    }));
  }

  async findPlacesInBBox(
    userId: string | null | undefined,
    bbox: BoundingBox
  ): Promise<SavedPlace[]> {
    const [minLng, minLat, maxLng, maxLat] = bbox;

    const whereConditions = [
      sql`${schema.savedPlaces.geom} && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`,
    ];

    if (userId) {
      whereConditions.push(
        or(eq(schema.savedPlaces.userId, userId), sql`${schema.savedPlaces.userId} IS NULL`)!
      );
    }

    const rows = await this.db
      .select()
      .from(schema.savedPlaces)
      .where(and(...whereConditions))
      .orderBy(desc(schema.savedPlaces.updatedAt));

    return rows;
  }

  // --- Saved Places CRUD ---

  async createSavedPlace(input: CreateSavedPlaceInput): Promise<SavedPlace> {
    const id = input.id ?? crypto.randomUUID();
    const now = new Date();
    const geomWkt = `SRID=4326;POINT(${input.longitude} ${input.latitude})`;

    const [created] = await this.db
      .insert(schema.savedPlaces)
      .values({
        id,
        userId: input.userId ?? null,
        providerId: input.providerId ?? null,
        name: input.name,
        formattedAddress: input.formattedAddress,
        category: input.category,
        latitude: input.latitude,
        longitude: input.longitude,
        geom: geomWkt,
        notes: input.notes ?? null,
        customColor: input.customColor ?? null,
        customIcon: input.customIcon ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error(`Failed to create saved place: ${input.name}`);
    }

    return created;
  }

  async getSavedPlaceById(id: string): Promise<SavedPlace | null> {
    const [place] = await this.db
      .select()
      .from(schema.savedPlaces)
      .where(eq(schema.savedPlaces.id, id))
      .limit(1);

    return place ?? null;
  }

  async listSavedPlaces(
    userId?: string | null,
    filter?: SavedPlaceFilter
  ): Promise<SavedPlace[]> {
    const whereConditions = [];

    if (userId !== undefined && userId !== null) {
      whereConditions.push(eq(schema.savedPlaces.userId, userId));
    }

    if (filter?.category) {
      whereConditions.push(eq(schema.savedPlaces.category, filter.category));
    }

    if (filter?.searchQuery) {
      const q = `%${filter.searchQuery}%`;
      whereConditions.push(
        or(
          sql`${schema.savedPlaces.name} ILIKE ${q}`,
          sql`${schema.savedPlaces.formattedAddress} ILIKE ${q}`,
          sql`${schema.savedPlaces.notes} ILIKE ${q}`
        )
      );
    }

    let query = this.db
      .select()
      .from(schema.savedPlaces)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(schema.savedPlaces.updatedAt));

    if (filter?.limit) {
      query = query.limit(filter.limit) as typeof query;
    }
    if (filter?.offset) {
      query = query.offset(filter.offset) as typeof query;
    }

    return query;
  }

  async updateSavedPlace(
    id: string,
    input: UpdateSavedPlaceInput
  ): Promise<SavedPlace | null> {
    const existing = await this.getSavedPlaceById(id);
    if (!existing) return null;

    const lat = input.latitude ?? existing.latitude;
    const lng = input.longitude ?? existing.longitude;
    const geomWkt = `SRID=4326;POINT(${lng} ${lat})`;

    const [updated] = await this.db
      .update(schema.savedPlaces)
      .set({
        name: input.name ?? existing.name,
        formattedAddress: input.formattedAddress ?? existing.formattedAddress,
        category: input.category ?? existing.category,
        latitude: lat,
        longitude: lng,
        geom: geomWkt,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        customColor: input.customColor !== undefined ? input.customColor : existing.customColor,
        customIcon: input.customIcon !== undefined ? input.customIcon : existing.customIcon,
        updatedAt: new Date(),
      })
      .where(eq(schema.savedPlaces.id, id))
      .returning();

    return updated ?? null;
  }

  async deleteSavedPlace(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.savedPlaces)
      .where(eq(schema.savedPlaces.id, id))
      .returning({ id: schema.savedPlaces.id });

    return result.length > 0;
  }

  // --- Collections CRUD ---

  async createCollection(input: CreateCollectionInput): Promise<PlaceCollection> {
    const id = input.id ?? crypto.randomUUID();
    const now = new Date();

    const [col] = await this.db
      .insert(schema.placeCollections)
      .values({
        id,
        userId: input.userId ?? null,
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? null,
        icon: input.icon ?? null,
        isPublic: input.isPublic ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!col) {
      throw new Error(`Failed to create collection: ${input.name}`);
    }

    return col;
  }

  async getCollectionById(
    id: string,
    includePlaces = false
  ): Promise<PlaceCollectionWithPlaces | PlaceCollection | null> {
    const [col] = await this.db
      .select()
      .from(schema.placeCollections)
      .where(eq(schema.placeCollections.id, id))
      .limit(1);

    if (!col) return null;
    if (!includePlaces) return col;

    const items = await this.getCollectionItems(id);
    const places = items.map((i) => i.savedPlace);

    return {
      ...col,
      places,
    };
  }

  async listCollections(userId?: string | null): Promise<PlaceCollection[]> {
    const whereConditions = [];
    if (userId !== undefined && userId !== null) {
      whereConditions.push(
        or(eq(schema.placeCollections.userId, userId), eq(schema.placeCollections.isPublic, true))
      );
    }

    return this.db
      .select()
      .from(schema.placeCollections)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(schema.placeCollections.updatedAt));
  }

  async updateCollection(
    id: string,
    input: UpdateCollectionInput
  ): Promise<PlaceCollection | null> {
    const existing = await this.db
      .select()
      .from(schema.placeCollections)
      .where(eq(schema.placeCollections.id, id))
      .limit(1);

    if (existing.length === 0) return null;

    const [updated] = await this.db
      .update(schema.placeCollections)
      .set({
        name: input.name ?? existing[0]!.name,
        description: input.description !== undefined ? input.description : existing[0]!.description,
        color: input.color !== undefined ? input.color : existing[0]!.color,
        icon: input.icon !== undefined ? input.icon : existing[0]!.icon,
        isPublic: input.isPublic !== undefined ? input.isPublic : existing[0]!.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(schema.placeCollections.id, id))
      .returning();

    return updated ?? null;
  }

  async deleteCollection(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.placeCollections)
      .where(eq(schema.placeCollections.id, id))
      .returning({ id: schema.placeCollections.id });

    return result.length > 0;
  }

  async addPlaceToCollection(
    collectionId: string,
    savedPlaceId: string,
    sortOrder = 0
  ): Promise<CollectionItem> {
    const id = crypto.randomUUID();
    const [item] = await this.db
      .insert(schema.collectionItems)
      .values({
        id,
        collectionId,
        savedPlaceId,
        sortOrder,
        addedAt: new Date(),
      })
      .returning();

    if (!item) {
      throw new Error(`Failed to add place ${savedPlaceId} to collection ${collectionId}`);
    }

    return item;
  }

  async removePlaceFromCollection(
    collectionId: string,
    savedPlaceId: string
  ): Promise<boolean> {
    const result = await this.db
      .delete(schema.collectionItems)
      .where(
        and(
          eq(schema.collectionItems.collectionId, collectionId),
          eq(schema.collectionItems.savedPlaceId, savedPlaceId)
        )
      )
      .returning({ id: schema.collectionItems.id });

    return result.length > 0;
  }

  async getCollectionItems(
    collectionId: string
  ): Promise<(CollectionItem & { savedPlace: SavedPlace })[]> {
    const rows = await this.db
      .select({
        id: schema.collectionItems.id,
        collectionId: schema.collectionItems.collectionId,
        savedPlaceId: schema.collectionItems.savedPlaceId,
        sortOrder: schema.collectionItems.sortOrder,
        addedAt: schema.collectionItems.addedAt,
        savedPlace: schema.savedPlaces,
      })
      .from(schema.collectionItems)
      .innerJoin(
        schema.savedPlaces,
        eq(schema.collectionItems.savedPlaceId, schema.savedPlaces.id)
      )
      .where(eq(schema.collectionItems.collectionId, collectionId))
      .orderBy(asc(schema.collectionItems.sortOrder));

    return rows;
  }

  // --- Map Features CRUD ---

  async createMapFeature(input: CreateMapFeatureInput): Promise<UserMapFeature> {
    const id = input.id ?? crypto.randomUUID();
    const now = new Date();

    const [feat] = await this.db
      .insert(schema.userMapFeatures)
      .values({
        id,
        userId: input.userId ?? null,
        name: input.name,
        featureType: input.featureType,
        geojson: input.geojson,
        properties: input.properties ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!feat) {
      throw new Error(`Failed to create map feature: ${input.name}`);
    }

    return feat;
  }

  async getMapFeatureById(id: string): Promise<UserMapFeature | null> {
    const [feat] = await this.db
      .select()
      .from(schema.userMapFeatures)
      .where(eq(schema.userMapFeatures.id, id))
      .limit(1);

    return feat ?? null;
  }

  async listMapFeatures(
    userId?: string | null,
    featureType?: MapFeatureType
  ): Promise<UserMapFeature[]> {
    const whereConditions = [];
    if (userId !== undefined && userId !== null) {
      whereConditions.push(eq(schema.userMapFeatures.userId, userId));
    }
    if (featureType) {
      whereConditions.push(eq(schema.userMapFeatures.featureType, featureType));
    }

    return this.db
      .select()
      .from(schema.userMapFeatures)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(schema.userMapFeatures.updatedAt));
  }

  async updateMapFeature(
    id: string,
    input: UpdateMapFeatureInput
  ): Promise<UserMapFeature | null> {
    const existing = await this.getMapFeatureById(id);
    if (!existing) return null;

    const [updated] = await this.db
      .update(schema.userMapFeatures)
      .set({
        name: input.name ?? existing.name,
        featureType: input.featureType ?? existing.featureType,
        geojson: input.geojson ?? existing.geojson,
        properties: input.properties !== undefined ? input.properties : existing.properties,
        updatedAt: new Date(),
      })
      .where(eq(schema.userMapFeatures.id, id))
      .returning();

    return updated ?? null;
  }

  async deleteMapFeature(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.userMapFeatures)
      .where(eq(schema.userMapFeatures.id, id))
      .returning({ id: schema.userMapFeatures.id });

    return result.length > 0;
  }

  // --- Search History ---

  async addSearchHistory(input: AddSearchHistoryInput): Promise<SearchHistoryItem> {
    const id = input.id ?? crypto.randomUUID();
    const [item] = await this.db
      .insert(schema.searchHistory)
      .values({
        id,
        userId: input.userId ?? null,
        query: input.query,
        selectedPlaceId: input.selectedPlaceId ?? null,
        selectedPlaceName: input.selectedPlaceName ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        createdAt: new Date(),
      })
      .returning();

    if (!item) {
      throw new Error(`Failed to add search history: ${input.query}`);
    }

    return item;
  }

  async getSearchHistory(
    userId?: string | null,
    limit = 20
  ): Promise<SearchHistoryItem[]> {
    const whereConditions = [];
    if (userId !== undefined && userId !== null) {
      whereConditions.push(eq(schema.searchHistory.userId, userId));
    }

    return this.db
      .select()
      .from(schema.searchHistory)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(schema.searchHistory.createdAt))
      .limit(limit);
  }

  async clearSearchHistory(userId?: string | null): Promise<boolean> {
    if (userId === undefined || userId === null) {
      await this.db.delete(schema.searchHistory);
      return true;
    }

    await this.db
      .delete(schema.searchHistory)
      .where(eq(schema.searchHistory.userId, userId));
    return true;
  }

  // --- Users & Preferences ---

  async createUser(input: CreateUserInput): Promise<User> {
    const id = input.id ?? crypto.randomUUID();
    const now = new Date();

    const [user] = await this.db
      .insert(schema.users)
      .values({
        id,
        email: input.email,
        name: input.name ?? null,
        avatarUrl: input.avatarUrl ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!user) {
      throw new Error(`Failed to create user: ${input.email}`);
    }

    // Default preferences
    await this.db.insert(schema.userPreferences).values({
      id: crypto.randomUUID(),
      userId: id,
      defaultStyle: 'streets',
      defaultZoom: 12,
      defaultCenterLng: -122.4194,
      defaultCenterLat: 37.7749,
      theme: 'system',
      distanceUnit: 'metric',
      updatedAt: now,
    });

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return user ?? null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(sql`LOWER(${schema.users.email}) = LOWER(${email})`)
      .limit(1);

    return user ?? null;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const [prefs] = await this.db
      .select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, userId))
      .limit(1);

    return prefs ?? null;
  }

  async updateUserPreferences(
    userId: string,
    input: UpdateUserPreferencesInput
  ): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    const now = new Date();

    if (!existing) {
      const [created] = await this.db
        .insert(schema.userPreferences)
        .values({
          id: crypto.randomUUID(),
          userId,
          defaultStyle: input.defaultStyle ?? 'streets',
          defaultZoom: input.defaultZoom ?? 12,
          defaultCenterLng: input.defaultCenterLng ?? -122.4194,
          defaultCenterLat: input.defaultCenterLat ?? 37.7749,
          theme: input.theme ?? 'system',
          distanceUnit: input.distanceUnit ?? 'metric',
          updatedAt: now,
        })
        .returning();

      return created!;
    }

    const [updated] = await this.db
      .update(schema.userPreferences)
      .set({
        defaultStyle: input.defaultStyle ?? existing.defaultStyle,
        defaultZoom: input.defaultZoom ?? existing.defaultZoom,
        defaultCenterLng: input.defaultCenterLng ?? existing.defaultCenterLng,
        defaultCenterLat: input.defaultCenterLat ?? existing.defaultCenterLat,
        theme: input.theme ?? existing.theme,
        distanceUnit: input.distanceUnit ?? existing.distanceUnit,
        updatedAt: now,
      })
      .where(eq(schema.userPreferences.userId, userId))
      .returning();

    return updated!;
  }
}
