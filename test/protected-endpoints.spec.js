const knex=require('knex');
const app=require('../src/app');
const helpers=require('./test-helpers');

describe('Articles Endpoints',function(){
	let db;
	const {testUsers,testArticles}=helpers.makeArticlesFixtures();

	before('make knex instance',()=>{
		db=knex({client:'pg',connection:process.env.TEST_DB_URL});
		app.set('db', db);
	});

	after('disconnect from db',()=>db.destroy());

	before('cleanup',()=>helpers.cleanTables(db));

	afterEach('cleanup',()=>helpers.cleanTables(db));

	describe(`Protected endpoints`,()=>{
		const protectedEndpoints=[
			{
				name:'GET /api/articles/:article_id',
				path:'/api/articles/1',
				method:supertest(app).get
			},
			{
				name:'GET /api/articles/:article_id/comments',
				path:'/api/articles/1/comments',
				method:supertest(app).get

			},
			{
				name:'POST /api/comments',
				path:'/api/comments',
				method:supertest(app).post
			},
			{
      			name:'POST /api/auth/refresh',
      			path:'/api/auth/refresh',
      			method:supertest(app).post
    		}
		];
		protectedEndpoints.forEach(endpoint=>{
			describe(endpoint.name,()=>{
				it(`responds with 401 'Missing bearer token' when no bearer token`,()=>{
					return endpoint.method(endpoint.path)
					.expect(401,{error:`Missing bearer token`});
				});
			});
			it(`responds 401 'Unauthorized request' when invalid JWT secret`,()=>{
				const userNoCreds={user_name:'',password:'' };
				return endpoint.method(endpoint.path)
				.set('Authorization',helpers.makeAuthHeader(userNoCreds))
				.expect(401,{error:`Unauthorized request`});
			});
			it('should return 401 \'Unauthorized request\' when invalid sub in payload',()=>{
				const invalidUser={user_name:'user-not-existy',id:1};
				return endpoint.method(endpoint.path)
				.set('Authorization', helpers.makeAuthHeader(invalidUser))
				.expect(401,{error:`Unauthorized request`});
			});
		});
    });
});