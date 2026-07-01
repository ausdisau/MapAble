export {
  ObjectStorageService,
  ObjectNotFoundError,
  objectStorageClient,
} from "./objectStorage";

export {
  AssetStore,
  assetStore,
  readJson,
  readText,
} from "./assetStore";

export type {
  AssetObject,
  AssetListResult,
  MergedAssetObject,
  FindFirstResult,
  ListOptions,
  PutOptions,
} from "./assetStore";

export {
  UnknownBucketError,
  BucketReadOnlyError,
  getBucketConfig,
  isKnownBucket,
  listBucketConfigs,
  DEFAULT_BUCKET_NAME,
  MERGED_DEFAULT_ORDER,
} from "./buckets";

export type { BucketConfig } from "./buckets";

export type {
  ObjectAclPolicy,
  ObjectAccessGroup,
  ObjectAccessGroupType,
  ObjectAclRule,
} from "./objectAcl";

export {
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

export { registerObjectStorageRoutes } from "./routes";

