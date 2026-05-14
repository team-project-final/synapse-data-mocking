// ===== Tab 10: Flutter Mocking Tools =====

function PageToolsFlutter() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[10]} />
      <ToolDocCTA doc={DOCS[10]} />

      <Section num="1" title="개요 — Flutter 테스트 의존성" sub="pubspec.yaml dev_dependencies 한눈에 보기">
        <Panel title="pubspec.yaml (dev_dependencies)">
          <Code lang="yaml">{`dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter

  # Mock frameworks
  mockito: ^5.4.4
  build_runner: ^2.4.9
  mocktail: ^1.0.3

  # HTTP mock
  dio_mock_interceptor: ^2.0.0

  # Code generation
  json_serializable: ^6.7.1
  freezed: ^3.2.3`}</Code>
          <CopyBtn text={`mockito: ^5.4.4\nbuild_runner: ^2.4.9\nmocktail: ^1.0.3\ndio_mock_interceptor: ^2.0.0`} />
        </Panel>
        <div style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>도구</th><th>버전</th><th>용도</th><th>테스트 유형</th></tr></thead>
            <tbody>
              {[
                ["dio mock adapter", "2.0.0", "HTTP 호출 가로채기", "Widget / Integration"],
                ["Mockito", "5.4.4", "Repository/Provider mock", "Unit / Widget"],
                ["flutter_test", "SDK", "Widget 테스트 프레임워크", "Widget"],
                ["mocktail", "1.0.3", "코드젠 불필요 mock 대안", "Unit"]
              ].map(([name, ver, purpose, type]) => (
                <tr key={name}>
                  <td><code style={{ color: "var(--cyan-bright)" }}>{name}</code></td>
                  <td className="mono tiny">{ver}</td>
                  <td className="tiny">{purpose}</td>
                  <td><Pill>{type}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section num="2" title="dio mock adapter" sub="dio HTTP 클라이언트 어댑터 교체 방식 · v2.0.0">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>dio mock adapter</strong>는 dio의 <code>HttpClientAdapter</code>를 교체하여 네트워크 호출을 가로채는 방식이다. Synapse에서는 모든 백엔드 API 호출을 <code>MockDioAdapter</code>로 mock한다.</p>
          </div>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>MockDioAdapter 구현</div>
          <Code lang="dart">{`class MockDioAdapter implements HttpClientAdapter {
  final Map<String, MockResponse> _mappings = {};

  void onGet(String path, MockResponse response) =>
      _mappings['GET:\$path'] = response;
  void onPost(String path, MockResponse response) =>
      _mappings['POST:\$path'] = response;
  void onPatch(String path, MockResponse response) =>
      _mappings['PATCH:\$path'] = response;
  void onDelete(String path, MockResponse response) =>
      _mappings['DELETE:\$path'] = response;

  @override
  Future<ResponseBody> fetch(RequestOptions options, ...) async {
    final key = '\${options.method}:\${options.path}';
    final response = _mappings[key] ?? _findPatternMatch(options);

    if (response == null) {
      throw DioException(
        requestOptions: options,
        error: 'No mock mapping for \$key',
        type: DioExceptionType.unknown,
      );
    }

    if (response.delay != null) await Future.delayed(response.delay!);

    return ResponseBody.fromString(
      jsonEncode(response.data),
      response.statusCode,
      headers: {'content-type': ['application/json']},
    );
  }
}`}</Code>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Mock/실제 전환 토글</div>
          <Code lang="dart">{`Dio createDioClient({bool useMock = false}) {
  final dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
  if (useMock) {
    dio.httpClientAdapter = MockDioAdapter()
      ..onPost('/auth/login', MockResponse(
          statusCode: 200,
          data: {"success": true, "data": {"accessToken": "mock_jwt"}}))
      ..onGet('/notes', MockResponse(
          statusCode: 200,
          data: {"success": true, "data": [...]}));
  }
  return dio;
}`}</Code>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: 기본 GET/POST mock 등록</div>
            <Code lang="dart">{`final adapter = MockDioAdapter();

// GET mock
adapter.onGet('/notes', MockResponse(
  statusCode: 200,
  data: {"success": true, "data": [
    {"id": "note-001", "title": "머신러닝 기초 정리"}
  ]},
));

// POST mock
adapter.onPost('/notes', MockResponse(
  statusCode: 201,
  data: {"success": true, "data": {"id": "note-003"}},
));`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 2: regex 패턴 매칭</div>
            <Code lang="dart">{`// /notes/:id 같은 동적 경로 매칭
MockResponse? _findPatternMatch(RequestOptions options) {
  final key = '\${options.method}:\${options.path}';
  for (final entry in _patternMappings.entries) {
    if (RegExp(entry.key).hasMatch(key)) {
      return entry.value;
    }
  }
  return null;
}

// 등록: regex 패턴으로
adapter.onGetPattern(r'/notes/[\\w-]+', MockResponse(...));`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: 네트워크 지연 시뮬레이션</div>
            <Code lang="dart">{`adapter.onPost('/ai/generate-cards', MockResponse(
  statusCode: 200,
  data: {"success": true, "data": {"cards": [...]}},
  delay: Duration(milliseconds: 800),  // Claude API 응답 시간 시뮬레이션
));`}</Code>
          </Panel>
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["unmapped route 에러", "DioException 메시지에 'No mock mapping for GET:/path' 표시 → 해당 경로 등록 필요"],
                ["method 와일드카드", "에러 응답(400/401/500)은 method='*'로 등록하면 모든 메서드에 매칭"],
                ["body 검증 불가", "MockDioAdapter는 요청 body를 검증하지 않음 — body 검증은 Mockito Repository mock에서"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Java: WireMock (08탭)" tab="tools-java" />
              <XRef label="Python: respx (09탭)" tab="tools-python" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="3" title="Mockito (Dart)" sub="Repository/Provider mock · v5.4.4">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>Mockito</strong> (Dart)는 <code>@GenerateMocks</code> 어노테이션과 <code>build_runner</code>로 mock 클래스를 자동 생성한다.</p>
          </div>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>1단계: 어노테이션 추가</div>
          <Code lang="dart">{`// test/repositories/note_repository_test.dart
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

@GenerateMocks([NoteRepository, CardRepository])
import 'note_repository_test.mocks.dart';`}</Code>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>2단계: 코드 생성</div>
          <Code>{`dart run build_runner build --delete-conflicting-outputs`}</Code>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>3단계: 테스트에서 사용</div>
          <Code lang="dart">{`void main() {
  late MockNoteRepository mockNoteRepo;

  setUp(() {
    mockNoteRepo = MockNoteRepository();
  });

  test('should return notes list', () async {
    when(mockNoteRepo.getNotes())
        .thenAnswer((_) async => [Note(id: 'note-001', title: '테스트')]);

    final notes = await mockNoteRepo.getNotes();

    expect(notes.length, 1);
    verify(mockNoteRepo.getNotes()).called(1);
  });
}`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Java: Mockito (08탭)" tab="tools-java" />
            <XRef label="Python: unittest.mock (09탭)" tab="tools-python" />
          </div>
        </Panel>
      </Section>

      <Section num="4" title="flutter_test" sub="Widget 테스트 프레임워크 · SDK 내장">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>flutter_test</strong>는 Flutter SDK 내장 위젯 테스트 프레임워크. <code>testWidgets</code>로 위젯을 렌더링하고, <code>find</code>로 요소를 찾고, <code>expect</code>로 검증한다.</p>
          </div>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>Widget 테스트 + Riverpod override</div>
          <Code lang="dart">{`// test/widgets/review_screen_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('ReviewScreen shows card count', (tester) async {
    final mockCardRepo = MockCardRepository();
    when(mockCardRepo.getDueCards())
        .thenAnswer((_) async => [card1, card2, card3]);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cardRepositoryProvider.overrideWithValue(mockCardRepo),
        ],
        child: const MaterialApp(home: ReviewScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('3장'), findsOneWidget);
    expect(find.byType(CardWidget), findsNWidgets(1));  // 첫 번째 카드
  });
}`}</Code>
        </Panel>
      </Section>

      <Section num="5" title="mocktail" sub="build_runner 없는 경량 mock 대안 · v1.0.3">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>mocktail</strong>은 Mockito와 달리 <code>build_runner</code> 코드 생성 없이 mock을 만든다. class 상속 방식으로 mock 정의.</p>
          </div>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>Mockito vs mocktail 비교</div>
          <table className="table">
            <thead><tr><th>항목</th><th>Mockito</th><th>mocktail</th></tr></thead>
            <tbody>
              <tr><td>Mock 생성</td><td><code>@GenerateMocks</code> + build_runner</td><td>class 상속 (수동)</td></tr>
              <tr><td>설정 시간</td><td>코드젠 필요 (느림)</td><td>즉시 (빠름)</td></tr>
              <tr><td>타입 안전성</td><td>컴파일 타임 검증</td><td>런타임 검증</td></tr>
              <tr><td className="tiny">추천 상황</td><td>프로덕션 코드, CI</td><td>프로토타입, 빠른 테스트</td></tr>
            </tbody>
          </table>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>mocktail 사용법</div>
          <Code lang="dart">{`import 'package:mocktail/mocktail.dart';

// Mock 정의 — class 상속만으로 끝
class MockNoteRepository extends Mock implements NoteRepository {}

void main() {
  late MockNoteRepository mockRepo;

  setUp(() {
    mockRepo = MockNoteRepository();
  });

  test('should fetch notes', () async {
    when(() => mockRepo.getNotes())
        .thenAnswer((_) async => [Note(id: 'note-001')]);

    final notes = await mockRepo.getNotes();
    expect(notes.length, 1);
  });
}`}</Code>
        </Panel>
      </Section>
    </div>
  );
}

Object.assign(window, { PageToolsFlutter });
