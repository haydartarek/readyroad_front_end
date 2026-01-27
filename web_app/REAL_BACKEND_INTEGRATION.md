# Real Backend Integration - Search & Notifications

## Overview

This document describes the **real backend integration** for the ReadyRoad web app. All data comes from the Spring Boot backend with MySQL database. **No mock data or simulation is used.**

## Backend Configuration

### API Base URL

```typescript
// src/lib/constants.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8890/api',
  TIMEOUT: 30000,
};
```

### Authentication

All API requests automatically include JWT token via Axios interceptors:

```typescript
// src/lib/api.ts
this.instance.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 1. Global Search Integration

### Frontend Implementation

**Location**: `src/hooks/use-search.ts`

**API Call**:

```typescript
const response = await apiClient.get<SearchResponse>('/api/search', {
  q: searchQuery,      // Search query string
  lang: language,      // Current language (en, ar, nl, fr)
});
```

### Required Backend Endpoint

**Spring Boot Controller**:

```java
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SearchController {
    
    private final SearchService searchService;
    
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SearchResponse> search(
        @RequestParam("q") String query,
        @RequestParam(value = "lang", defaultValue = "en") String language,
        @AuthenticationPrincipal User currentUser
    ) {
        // Validate query
        if (query == null || query.trim().isEmpty()) {
            throw new BadRequestException("Query parameter 'q' is required");
        }
        
        // Execute search with user context
        SearchResponse results = searchService.search(
            query.trim(), 
            language, 
            currentUser
        );
        
        return ResponseEntity.ok(results);
    }
}
```

### Response Contract

**Expected JSON Structure**:

```json
{
  "query": "user's search query",
  "results": [
    {
      "id": "123",
      "type": "PAGE",
      "title": "Dashboard",
      "href": "/dashboard",
      "meta": null
    },
    {
      "id": "456",
      "type": "SIGN",
      "title": "Dangerous Curve to Right",
      "href": "/traffic-signs/456",
      "meta": {
        "signCode": "A1",
        "category": "Danger Signs"
      }
    },
    {
      "id": "789",
      "type": "LESSON",
      "title": "Right of Way",
      "href": "/lessons/789",
      "meta": {
        "category": "Basic Theory"
      }
    }
  ]
}
```

**TypeScript Interface**:

```typescript
interface SearchResult {
  id: string;
  type: 'PAGE' | 'SIGN' | 'LESSON';
  title: string;
  href: string;
  meta?: {
    signCode?: string;
    category?: string;
  };
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
}
```

### Backend Search Service Implementation

```java
@Service
@RequiredArgsConstructor
public class SearchService {
    
    private final TrafficSignRepository trafficSignRepository;
    private final LessonRepository lessonRepository;
    
    public SearchResponse search(String query, String language, User user) {
        List<SearchResult> results = new ArrayList<>();
        String normalizedQuery = query.toLowerCase();
        
        // 1. Search static pages
        results.addAll(searchPages(normalizedQuery, language));
        
        // 2. Search traffic signs
        List<TrafficSign> signs = trafficSignRepository
            .findByCodeContainingIgnoreCaseOrTitleContaining(
                normalizedQuery, 
                normalizedQuery,
                PageRequest.of(0, 5)
            );
        
        results.addAll(signs.stream()
            .map(sign -> mapSignToResult(sign, language))
            .collect(Collectors.toList()));
        
        // 3. Search lessons (respect user permissions)
        List<Lesson> lessons = lessonRepository
            .findByTitleContainingAndUserHasAccess(
                normalizedQuery, 
                user.getId(),
                PageRequest.of(0, 5)
            );
        
        results.addAll(lessons.stream()
            .map(lesson -> mapLessonToResult(lesson, language))
            .collect(Collectors.toList()));
        
        // Limit total results
        List<SearchResult> limitedResults = results.stream()
            .limit(15)
            .collect(Collectors.toList());
        
        return new SearchResponse(query, limitedResults);
    }
    
    private List<SearchResult> searchPages(String query, String language) {
        Map<String, Map<String, String>> pages = Map.of(
            "home", Map.of("en", "Home", "ar", "الرئيسية", "nl", "Home", "fr", "Accueil"),
            "dashboard", Map.of("en", "Dashboard", "ar", "لوحة التحكم", "nl", "Dashboard", "fr", "Tableau de bord"),
            "exam", Map.of("en", "Exam", "ar", "الامتحان", "nl", "Examen", "fr", "Examen"),
            "practice", Map.of("en", "Practice", "ar", "التدريب", "nl", "Oefenen", "fr", "Pratique")
        );
        
        return pages.entrySet().stream()
            .filter(entry -> {
                String title = entry.getValue().getOrDefault(language, entry.getValue().get("en"));
                return title.toLowerCase().contains(query);
            })
            .map(entry -> SearchResult.builder()
                .id(entry.getKey())
                .type(ResultType.PAGE)
                .title(entry.getValue().getOrDefault(language, entry.getValue().get("en")))
                .href("/" + (entry.getKey().equals("home") ? "" : entry.getKey()))
                .build())
            .collect(Collectors.toList());
    }
}
```

### Database Queries

**Traffic Signs Repository**:

```java
@Repository
public interface TrafficSignRepository extends JpaRepository<TrafficSign, Long> {
    
    @Query("SELECT s FROM TrafficSign s WHERE " +
           "LOWER(s.code) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.titleEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.titleAr) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.titleNl) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.titleFr) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<TrafficSign> findByCodeContainingIgnoreCaseOrTitleContaining(
        @Param("query") String query,
        @Param("query") String titleQuery,
        Pageable pageable
    );
}
```

**Lessons Repository**:

```java
@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    
    @Query("SELECT l FROM Lesson l WHERE " +
           "(LOWER(l.titleEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.titleAr) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.titleNl) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(l.titleFr) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "l.id IN (SELECT up.lesson.id FROM UserProgress up WHERE up.user.id = :userId)")
    List<Lesson> findByTitleContainingAndUserHasAccess(
        @Param("query") String query,
        @Param("userId") Long userId,
        Pageable pageable
    );
}
```

## 2. Notifications System Integration

### Frontend Implementation

**Location**: `src/components/layout/navbar.tsx`

**API Call**:

```typescript
const response = await apiClient.get<{ unreadCount: number }>(
  '/api/users/me/notifications/unread-count'
);
setUnreadCount(response.data.unreadCount || 0);
```

**Polling Strategy**:

- Fetches immediately on user login
- Polls every 30 seconds while user is logged in
- Refreshes when tab becomes visible again
- Stops polling on logout
- Clears interval on component unmount

### Required Backend Endpoint

**Spring Boot Controller**:

```java
@RestController
@RequestMapping("/api/users/me/notifications")
@RequiredArgsConstructor
public class NotificationController {
    
    private final NotificationService notificationService;
    
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
        @AuthenticationPrincipal User currentUser
    ) {
        long unreadCount = notificationService.countUnreadByUser(currentUser.getId());
        return ResponseEntity.ok(new UnreadCountResponse(unreadCount));
    }
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(
        @AuthenticationPrincipal User currentUser,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<Notification> notifications = notificationService
            .findByUserIdOrderByCreatedAtDesc(
                currentUser.getId(),
                PageRequest.of(page, size)
            );
        
        List<NotificationDTO> dtos = notifications.stream()
            .map(NotificationDTO::from)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(
        @PathVariable Long id,
        @AuthenticationPrincipal User currentUser
    ) {
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
```

### Response Contract

**Unread Count Response**:

```json
{
  "unreadCount": 5
}
```

**TypeScript Interface**:

```typescript
interface UnreadCountResponse {
  unreadCount: number;
}
```

### Backend Service Implementation

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    public long countUnreadByUser(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }
    
    public Page<Notification> findByUserIdOrderByCreatedAtDesc(
        Long userId, 
        Pageable pageable
    ) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
    
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository
            .findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new NotFoundException("Notification not found"));
        
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }
    
    @Transactional
    public void createNotification(
        User user, 
        String title, 
        String message, 
        NotificationType type
    ) {
        Notification notification = Notification.builder()
            .user(user)
            .title(title)
            .message(message)
            .type(type)
            .read(false)
            .createdAt(LocalDateTime.now())
            .build();
        
        notificationRepository.save(notification);
    }
}
```

### Database Schema

**Notifications Table**:

```sql
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created_at (created_at DESC)
);
```

**Repository**:

```java
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    long countByUserIdAndReadFalse(Long userId);
    
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    
    @Modifying
    @Query("UPDATE Notification n SET n.read = true, n.readAt = CURRENT_TIMESTAMP " +
           "WHERE n.user.id = :userId AND n.read = false")
    void markAllAsReadForUser(@Param("userId") Long userId);
}
```

## Security & Best Practices

### JWT Validation

All endpoints must validate JWT token:

```java
@PreAuthorize("isAuthenticated()")
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```java
@RateLimiter(name = "searchAPI", fallbackMethod = "searchRateLimitFallback")
public SearchResponse search(String query, String language, User user) {
    // Implementation
}
```

### Input Validation

Always validate and sanitize user input:

```java
@Valid
@NotBlank(message = "Query cannot be empty")
@Size(min = 2, max = 100, message = "Query must be between 2 and 100 characters")
String query
```

### Logging

Log search queries for analytics (without sensitive data):

```java
log.info("Search executed: user={}, query={}, resultsCount={}", 
    user.getUsername(), 
    query, 
    results.size()
);
```

### Performance Optimization

1. **Database Indexes**: Create indexes on searchable columns

```sql
CREATE INDEX idx_traffic_signs_code ON traffic_signs(code);
CREATE INDEX idx_traffic_signs_title_en ON traffic_signs(title_en);
CREATE FULLTEXT INDEX idx_lessons_title ON lessons(title_en, title_ar, title_nl, title_fr);
```

1. **Caching**: Cache search results for popular queries

```java
@Cacheable(value = "searchResults", key = "#query + '-' + #language")
public SearchResponse search(String query, String language, User user) {
    // Implementation
}
```

1. **Pagination**: Limit results per type

```java
PageRequest.of(0, 5) // Maximum 5 results per type
```

## Error Handling

### Backend Error Responses

```java
@ExceptionHandler(BadRequestException.class)
public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
    return ResponseEntity
        .badRequest()
        .body(new ErrorResponse("INVALID_QUERY", ex.getMessage()));
}

@ExceptionHandler(AuthenticationException.class)
public ResponseEntity<ErrorResponse> handleUnauthorized(AuthenticationException ex) {
    return ResponseEntity
        .status(HttpStatus.UNAUTHORIZED)
        .body(new ErrorResponse("UNAUTHORIZED", "Invalid or expired token"));
}
```

### Frontend Error Handling

Already implemented in `use-search.ts`:

```typescript
try {
  const response = await apiClient.get<SearchResponse>('/api/search', {
    q: searchQuery,
    lang: language,
  });
  setResults(response.data.results || []);
} catch (error) {
  console.error('Search error:', error);
  setResults([]); // Show empty state
}
```

## Testing

### Backend Unit Tests

```java
@Test
@WithMockUser(username = "testuser")
void testSearch_withValidQuery_returnsResults() {
    // Given
    String query = "A1";
    String language = "en";
    
    // When
    ResponseEntity<SearchResponse> response = searchController.search(
        query, 
        language, 
        mockUser
    );
    
    // Then
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertNotNull(response.getBody());
    assertFalse(response.getBody().getResults().isEmpty());
}
```

### Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
class SearchIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser
    void testSearchEndpoint() throws Exception {
        mockMvc.perform(get("/api/search")
                .param("q", "traffic")
                .param("lang", "en")
                .header("Authorization", "Bearer " + jwtToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.results").isArray())
            .andExpect(jsonPath("$.query").value("traffic"));
    }
}
```

## Environment Variables

### Development

```env
NEXT_PUBLIC_API_URL=http://localhost:8890/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

### Production

```env
NEXT_PUBLIC_API_URL=https://api.readyroad.com/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

## Deployment Checklist

- [ ] Backend `/api/search` endpoint implemented
- [ ] Backend `/api/users/me/notifications/unread-count` endpoint implemented
- [ ] Database indexes created for search columns
- [ ] JWT authentication enabled
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Frontend environment variables set
- [ ] Backend CORS configured for frontend domain
- [ ] SSL certificates installed for production
- [ ] Monitoring and logging enabled

## Status

✅ **Frontend**: Fully implemented, calling real backend APIs
⚠️ **Backend**: Requires implementation of endpoints documented above
✅ **Authentication**: JWT automatically included via interceptors
✅ **Error Handling**: Graceful fallbacks implemented
✅ **No Mock Data**: All mock endpoints removed

---

**Last Updated**: January 27, 2026
**Integration Type**: Real Backend (Spring Boot + MySQL)
**Authentication**: JWT Bearer Token
